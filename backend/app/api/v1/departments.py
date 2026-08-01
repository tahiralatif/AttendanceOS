"""Department API routes."""
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.department import Department
from app.models.user import User, UserRole
from app.api.deps import require_role, get_current_tenant

router = APIRouter(prefix="/departments", tags=["Departments"])


class DepartmentCreate:
    pass


from pydantic import BaseModel, Field


class DeptCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class DeptUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class DeptResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


@router.get("", response_model=list[DeptResponse])
async def list_departments(
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """List all departments."""
    result = await db.execute(
        select(Department).where(
            Department.tenant_id == tenant_id,
        ).order_by(Department.name)
    )
    return result.scalars().all()


@router.post("", response_model=DeptResponse, status_code=201)
async def create_department(
    data: DeptCreate,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """Create a new department."""
    # Check duplicate
    existing = await db.execute(
        select(Department).where(
            Department.tenant_id == tenant_id,
            Department.name == data.name,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Department already exists")

    dept = Department(
        tenant_id=tenant_id,
        name=data.name,
        description=data.description,
    )
    db.add(dept)
    await db.flush()
    return dept


@router.put("/{dept_id}", response_model=DeptResponse)
async def update_department(
    dept_id: UUID,
    data: DeptUpdate,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """Update a department."""
    result = await db.execute(
        select(Department).where(Department.id == dept_id, Department.tenant_id == tenant_id)
    )
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(dept, field, value)
    await db.flush()
    return dept


@router.delete("/{dept_id}", status_code=204)
async def delete_department(
    dept_id: UUID,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """Deactivate a department."""
    result = await db.execute(
        select(Department).where(Department.id == dept_id, Department.tenant_id == tenant_id)
    )
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    dept.is_active = False
    await db.flush()
    return None
