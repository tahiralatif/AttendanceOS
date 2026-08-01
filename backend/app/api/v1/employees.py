"""Employee API routes — CRUD, create-with-user, import."""
import csv
import io
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field, EmailStr
from datetime import date

from app.database import get_db
from app.models.employee import Employee, EmployeeStatus
from app.models.user import User, UserRole, UserStatus
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.api.deps import get_current_user, get_current_tenant, require_role
from app.utils.security import hash_password

router = APIRouter(prefix="/employees", tags=["Employees"])


# ── Schemas for combined create ──

class EmployeeWithUserCreate(BaseModel):
    """Create user account + employee profile in one step."""
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    employee_code: str = Field(..., min_length=1, max_length=50)
    department: Optional[str] = None
    designation: Optional[str] = None
    join_date: date
    phone: Optional[str] = None


class EmployeeWithUserResponse(BaseModel):
    user_id: UUID
    employee_id: UUID
    email: str
    full_name: str
    employee_code: str
    temp_password: str


class EmployeeFullResponse(EmployeeResponse):
    """Employee with user details."""
    full_name: str = ""
    email: str = ""
    department: Optional[str] = None
    designation: Optional[str] = None
    status: EmployeeStatus

    class Config:
        from_attributes = True


# ── List employees ──

@router.get("")
async def list_employees(
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[EmployeeStatus] = Query(None, alias="status"),
    department: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)),
):
    """List employees with user details."""
    query = (
        select(
            Employee,
            User.full_name,
            User.email,
            User.status.label("user_status"),
        )
        .join(User, Employee.user_id == User.id)
        .where(Employee.tenant_id == tenant_id)
    )
    if status_filter:
        query = query.where(Employee.status == status_filter)
    if department:
        query = query.where(Employee.department == department)
    if search:
        term = f"%{search}%"
        query = query.where(
            (User.full_name.ilike(term)) | (Employee.employee_code.ilike(term)) | (User.email.ilike(term))
        )
    query = query.order_by(User.full_name).offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "id": str(emp.id),
            "tenant_id": str(emp.tenant_id),
            "user_id": str(emp.user_id),
            "employee_code": emp.employee_code,
            "department": emp.department or "Unassigned",
            "designation": emp.designation or "—",
            "join_date": emp.join_date.isoformat(),
            "status": emp.status.value,
            "full_name": full_name,
            "email": email,
            "user_status": user_status.value if hasattr(user_status, 'value') else str(user_status),
            "created_at": emp.created_at.isoformat() if emp.created_at else None,
        }
        for emp, full_name, email, user_status in rows
    ]


@router.get("/count")
async def employee_count(
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get employee count."""
    result = await db.execute(
        select(func.count(Employee.id)).where(
            Employee.tenant_id == tenant_id,
            Employee.status == EmployeeStatus.ACTIVE,
        )
    )
    return {"count": result.scalar() or 0}


# ── Create employee with user account ──

@router.post("/create-with-user", status_code=201)
async def create_employee_with_user(
    data: EmployeeWithUserCreate,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """Create a new employee with a user account in one step."""
    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check employee code uniqueness within tenant
    existing_code = await db.execute(
        select(Employee).where(
            Employee.tenant_id == tenant_id,
            Employee.employee_code == data.employee_code,
        )
    )
    if existing_code.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Employee code already exists")

    # Create user with EMPLOYEE role
    new_user = User(
        tenant_id=tenant_id,
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.EMPLOYEE,
        status=UserStatus.ACTIVE,
        is_email_verified=True,
    )
    db.add(new_user)
    await db.flush()

    # Create employee profile
    employee = Employee(
        tenant_id=tenant_id,
        user_id=new_user.id,
        employee_code=data.employee_code,
        department=data.department,
        designation=data.designation,
        join_date=data.join_date,
        status=EmployeeStatus.ACTIVE,
    )
    db.add(employee)
    await db.flush()

    return {
        "user_id": str(new_user.id),
        "employee_id": str(employee.id),
        "email": new_user.email,
        "full_name": new_user.full_name,
        "employee_code": employee.employee_code,
        "temp_password": data.password,
    }


# ── Get single employee ──

@router.get("/{employee_id}")
async def get_employee(
    employee_id: UUID,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get employee details with user info."""
    result = await db.execute(
        select(Employee, User.full_name, User.email, User.status.label("user_status"))
        .join(User, Employee.user_id == User.id)
        .where(Employee.id == employee_id, Employee.tenant_id == tenant_id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp, full_name, email, user_status = row
    return {
        "id": str(emp.id),
        "tenant_id": str(emp.tenant_id),
        "user_id": str(emp.user_id),
        "employee_code": emp.employee_code,
        "department": emp.department,
        "designation": emp.designation,
        "join_date": emp.join_date.isoformat(),
        "status": emp.status.value,
        "full_name": full_name,
        "email": email,
    }


# ── Update employee ──

@router.put("/{employee_id}")
async def update_employee(
    employee_id: UUID,
    data: EmployeeUpdate,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """Update employee details."""
    result = await db.execute(
        select(Employee).where(Employee.id == employee_id, Employee.tenant_id == tenant_id)
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)
    await db.flush()
    return {"status": "updated"}


# ── Deactivate employee ──

@router.delete("/{employee_id}", status_code=200)
async def deactivate_employee(
    employee_id: UUID,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """Deactivate an employee (soft delete)."""
    result = await db.execute(
        select(Employee).where(Employee.id == employee_id, Employee.tenant_id == tenant_id)
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    employee.status = EmployeeStatus.INACTIVE
    # Also deactivate user
    user_result = await db.execute(select(User).where(User.id == employee.user_id))
    user_obj = user_result.scalar_one_or_none()
    if user_obj:
        user_obj.status = UserStatus.INACTIVE
    await db.flush()
    return {"status": "deactivated"}


# ── Reactivate employee ──

@router.post("/{employee_id}/reactivate", status_code=200)
async def reactivate_employee(
    employee_id: UUID,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """Reactivate a deactivated employee."""
    result = await db.execute(
        select(Employee).where(Employee.id == employee_id, Employee.tenant_id == tenant_id)
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    employee.status = EmployeeStatus.ACTIVE
    user_result = await db.execute(select(User).where(User.id == employee.user_id))
    user_obj = user_result.scalar_one_or_none()
    if user_obj:
        user_obj.status = UserStatus.ACTIVE
    await db.flush()
    return {"status": "reactivated"}


# ── CSV Import ──

@router.post("/import")
async def import_employees(
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """Import employees from CSV. Columns: full_name, email, employee_code, department, designation, join_date, password"""
    if not file.filename or not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV files supported")

    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    results = {"created": 0, "skipped": 0, "errors": []}

    for i, row in enumerate(reader, start=2):
        try:
            email = row.get("email", "").strip()
            full_name = row.get("full_name", "").strip()
            emp_code = row.get("employee_code", "").strip()
            dept = row.get("department", "").strip() or None
            desig = row.get("designation", "").strip() or None
            join = row.get("join_date", "").strip()
            pw = row.get("password", "").strip() or "ChangeMe123!"

            if not email or not full_name or not emp_code:
                results["errors"].append(f"Row {i}: missing required fields")
                results["skipped"] += 1
                continue

            # Check email
            existing = await db.execute(select(User).where(User.email == email))
            if existing.scalar_one_or_none():
                results["errors"].append(f"Row {i}: email {email} already exists")
                results["skipped"] += 1
                continue

            # Create user
            new_user = User(
                tenant_id=tenant_id,
                email=email,
                password_hash=hash_password(pw),
                full_name=full_name,
                role=UserRole.EMPLOYEE,
                status=UserStatus.ACTIVE,
                is_email_verified=True,
            )
            db.add(new_user)
            await db.flush()

            # Create employee
            employee = Employee(
                tenant_id=tenant_id,
                user_id=new_user.id,
                employee_code=emp_code,
                department=dept,
                designation=desig,
                join_date=date.fromisoformat(join) if join else date.today(),
                status=EmployeeStatus.ACTIVE,
            )
            db.add(employee)
            await db.flush()
            results["created"] += 1

        except Exception as e:
            results["errors"].append(f"Row {i}: {str(e)}")
            results["skipped"] += 1

    return results
