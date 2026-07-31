"""Employee API routes."""
from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.employee import Employee, EmployeeStatus
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.api.deps import get_current_user, get_current_tenant, require_role
from app.models.user import UserRole

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("", response_model=list[EmployeeResponse])
async def list_employees(
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[EmployeeStatus] = Query(None, alias="status"),
    department: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)),
):
    """List employees for the organization."""
    query = select(Employee).where(Employee.tenant_id == tenant_id)
    if status_filter:
        query = query.where(Employee.status == status_filter)
    if department:
        query = query.where(Employee.department == department)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=EmployeeResponse, status_code=201)
async def create_employee(
    data: EmployeeCreate,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """Create a new employee."""
    user_result = await db.execute(
        select(User).where(User.id == data.user_id, User.tenant_id == tenant_id)
    )
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found in this organization")

    existing = await db.execute(
        select(Employee).where(Employee.user_id == data.user_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already has an employee profile")

    employee = Employee(
        tenant_id=tenant_id,
        user_id=data.user_id,
        employee_code=data.employee_code,
        department=data.department,
        designation=data.designation,
        join_date=data.join_date,
    )
    db.add(employee)
    await db.flush()
    return employee


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: UUID,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get employee details."""
    result = await db.execute(
        select(Employee).where(
            Employee.id == employee_id,
            Employee.tenant_id == tenant_id,
        )
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: UUID,
    data: EmployeeUpdate,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """Update employee details."""
    result = await db.execute(
        select(Employee).where(
            Employee.id == employee_id,
            Employee.tenant_id == tenant_id,
        )
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)

    await db.flush()
    return employee


@router.delete("/{employee_id}", status_code=204)
async def deactivate_employee(
    employee_id: UUID,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """Deactivate an employee (soft delete)."""
    result = await db.execute(
        select(Employee).where(
            Employee.id == employee_id,
            Employee.tenant_id == tenant_id,
        )
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    employee.status = EmployeeStatus.TERMINATED
    await db.flush()
    return None