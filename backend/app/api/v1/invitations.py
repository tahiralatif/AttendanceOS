"""Invitation API routes — invite employees, validate tokens, accept invitations."""
import secrets
from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field, EmailStr

from app.database import get_db
from app.models.invitation import EmployeeInvitation
from app.models.user import User, UserRole, UserStatus
from app.models.employee import Employee, EmployeeStatus
from app.models.tenant import Tenant
from app.api.deps import get_current_user, get_current_tenant, require_role
from app.utils.security import hash_password
from app.services.email import send_invitation_email

router = APIRouter(prefix="/employees", tags=["Invitations"])


# ── Schemas ──

class InviteEmployeeRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    employee_code: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = None
    designation: Optional[str] = None


class AcceptInvitationRequest(BaseModel):
    password: str = Field(..., min_length=8, max_length=128)


class InvitationResponse(BaseModel):
    email: str
    full_name: str
    employee_code: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    status: str
    created_at: str
    expires_at: str
    accepted_at: Optional[str] = None


# ── Send invitation (Admin) ──

@router.post("/invite", status_code=201)
async def send_invitation(
    data: InviteEmployeeRequest,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """Admin sends an invitation to an employee."""
    # Check if email already has an account
    existing_user = await db.execute(select(User).where(User.email == data.email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already has an account")

    # Check for pending invitation with same email in this tenant
    existing_invite = await db.execute(
        select(EmployeeInvitation).where(
            EmployeeInvitation.tenant_id == tenant_id,
            EmployeeInvitation.email == data.email,
            EmployeeInvitation.status == "pending",
        )
    )
    if existing_invite.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Invitation already pending for this email")

    # Generate secure token
    token = secrets.token_urlsafe(32)

    # Create invitation
    invitation = EmployeeInvitation(
        tenant_id=tenant_id,
        email=data.email,
        full_name=data.full_name,
        employee_code=data.employee_code,
        department=data.department,
        designation=data.designation,
        token=token,
        status="pending",
        invited_by=user.id,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    db.add(invitation)
    await db.flush()

    # Send mock email
    invite_link = send_invitation_email(data.email, data.full_name, token)

    return {
        "invite_link": invite_link,
        "email": data.email,
        "expires_at": invitation.expires_at.isoformat(),
        "status": "pending",
    }


# ── List invitations for tenant (Admin) ──

@router.get("/invitations")
async def list_invitations(
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """List all invitations for the tenant."""
    result = await db.execute(
        select(EmployeeInvitation)
        .where(EmployeeInvitation.tenant_id == tenant_id)
        .order_by(EmployeeInvitation.created_at.desc())
    )
    invitations = result.scalars().all()

    return [
        {
            "id": str(inv.id),
            "email": inv.email,
            "full_name": inv.full_name,
            "employee_code": inv.employee_code,
            "department": inv.department,
            "designation": inv.designation,
            "status": inv.status,
            "created_at": inv.created_at.isoformat() if inv.created_at else None,
            "expires_at": inv.expires_at.isoformat() if inv.expires_at else None,
            "accepted_at": inv.accepted_at.isoformat() if inv.accepted_at else None,
        }
        for inv in invitations
    ]


# ── Validate invitation token (Public) ──

@router.get("/invite/{token}")
async def validate_invitation(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Validate an invitation token. Public endpoint — no auth required."""
    result = await db.execute(
        select(EmployeeInvitation).where(EmployeeInvitation.token == token)
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid invitation link")

    if invitation.status == "accepted":
        raise HTTPException(status_code=400, detail="Invitation already accepted")

    if invitation.expires_at < datetime.utcnow():
        # Mark as expired
        invitation.status = "expired"
        await db.flush()
        raise HTTPException(status_code=410, detail="Invitation has expired")

    if invitation.status == "expired":
        raise HTTPException(status_code=410, detail="Invitation has expired")

    return {
        "email": invitation.email,
        "full_name": invitation.full_name,
        "department": invitation.department,
        "designation": invitation.designation,
        "status": invitation.status,
        "expires_at": invitation.expires_at.isoformat(),
    }


# ── Accept invitation (Public) ──

@router.post("/invite/{token}/accept")
async def accept_invitation(
    token: str,
    data: AcceptInvitationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Accept an invitation and set password. Creates User + Employee records."""
    result = await db.execute(
        select(EmployeeInvitation).where(EmployeeInvitation.token == token)
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid invitation link")

    if invitation.status == "accepted":
        raise HTTPException(status_code=400, detail="Invitation already accepted")

    if invitation.expires_at < datetime.utcnow():
        invitation.status = "expired"
        await db.flush()
        raise HTTPException(status_code=410, detail="Invitation has expired")

    if invitation.status == "expired":
        raise HTTPException(status_code=410, detail="Invitation has expired")

    # Check email not already taken
    existing_user = await db.execute(select(User).where(User.email == invitation.email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already has an account")

    # Check employee code uniqueness within tenant
    if invitation.employee_code:
        existing_code = await db.execute(
            select(Employee).where(
                Employee.tenant_id == invitation.tenant_id,
                Employee.employee_code == invitation.employee_code,
            )
        )
        if existing_code.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Employee code already exists")

    # Create User
    new_user = User(
        tenant_id=invitation.tenant_id,
        email=invitation.email,
        password_hash=hash_password(data.password),
        full_name=invitation.full_name,
        role=UserRole.EMPLOYEE,
        status=UserStatus.ACTIVE,
        is_email_verified=True,
    )
    db.add(new_user)
    await db.flush()

    # Generate employee code if not provided
    emp_code = invitation.employee_code
    if not emp_code:
        # Auto-generate: first 3 letters of name + random 4 digits
        prefix = "".join(c for c in invitation.full_name[:3] if c.isalpha()).upper()
        if len(prefix) < 3:
            prefix = prefix.ljust(3, "X")
        random_part = secrets.token_hex(2)  # 4 hex chars
        emp_code = f"{prefix}-{random_part}"

    # Create Employee
    employee = Employee(
        tenant_id=invitation.tenant_id,
        user_id=new_user.id,
        employee_code=emp_code,
        department=invitation.department,
        designation=invitation.designation,
        join_date=datetime.utcnow().date(),
        status=EmployeeStatus.ACTIVE,
    )
    db.add(employee)

    # Mark invitation as accepted
    invitation.status = "accepted"
    invitation.accepted_at = datetime.utcnow()

    await db.flush()

    return {
        "message": "Invitation accepted successfully",
        "email": invitation.email,
        "full_name": invitation.full_name,
        "employee_code": employee.employee_code,
    }
