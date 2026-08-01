"""Admin API routes — company-wide dashboard, analytics."""
from uuid import UUID
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.models.employee import Employee, EmployeeStatus
from app.models.attendance import AttendanceRecord, AttendanceStatus
from app.api.deps import require_role, get_current_user, get_current_tenant

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


@router.get("/dashboard-stats")
async def get_dashboard_stats(
    target_date: Optional[date] = Query(None),
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)),
):
    """Company-wide attendance stats for admin dashboard."""
    if target_date is None:
        target_date = date.today()

    # Total active employees
    total_result = await db.execute(
        select(func.count(Employee.id)).where(
            Employee.tenant_id == tenant_id,
            Employee.status == EmployeeStatus.ACTIVE,
        )
    )
    total_employees = total_result.scalar() or 0

    # Today's attendance records
    att_result = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.tenant_id == tenant_id,
            AttendanceRecord.date == target_date,
        )
    )
    records = att_result.scalars().all()

    # Classify
    present = 0
    absent = 0
    late = 0
    on_leave = 0
    half_day = 0
    currently_checked_in = 0
    currently_working = 0

    for r in records:
        if r.status == AttendanceStatus.PRESENT:
            present += 1
            if r.clock_out is None:
                currently_checked_in += 1
                currently_working += 1
            elif r.total_hours and r.total_hours >= 8:
                currently_working += 1
        elif r.status == AttendanceStatus.LATE:
            late += 1
            present += 1
            if r.clock_out is None:
                currently_checked_in += 1
                currently_working += 1
        elif r.status == AttendanceStatus.OVERTIME:
            present += 1
            if r.clock_out is None:
                currently_checked_in += 1
            currently_working += 1
        elif r.status == AttendanceStatus.ON_LEAVE:
            on_leave += 1
        elif r.status == AttendanceStatus.HALF_DAY:
            half_day += 1
            present += 1
            if r.clock_out is None:
                currently_checked_in += 1
        elif r.status == AttendanceStatus.ABSENT:
            absent += 1

    # Absent = total - all accounted records
    accounted = present + on_leave
    absent = max(0, total_employees - accounted)

    return {
        "date": target_date.isoformat(),
        "total_employees": total_employees,
        "present": present,
        "absent": absent,
        "late": late,
        "on_leave": on_leave,
        "half_day": half_day,
        "currently_checked_in": currently_checked_in,
        "currently_working": currently_working,
    }


@router.get("/attendance-all")
async def get_all_attendance(
    target_date: Optional[date] = Query(None),
    department: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)),
):
    """Get all employee attendance for a date (with filters). Admin only."""
    if target_date is None:
        target_date = date.today()

    query = (
        select(
            Employee.id.label("employee_id"),
            Employee.employee_code,
            Employee.department,
            Employee.designation,
            User.full_name.label("employee_name"),
            User.email.label("employee_email"),
            AttendanceRecord.clock_in,
            AttendanceRecord.clock_out,
            AttendanceRecord.status,
            AttendanceRecord.total_hours,
            AttendanceRecord.overtime_hours,
            AttendanceRecord.source,
        )
        .select_from(Employee)
        .join(User, Employee.user_id == User.id)
        .outerjoin(
            AttendanceRecord,
            and_(
                AttendanceRecord.employee_id == Employee.id,
                AttendanceRecord.date == target_date,
            ),
        )
        .where(Employee.tenant_id == tenant_id, Employee.status == EmployeeStatus.ACTIVE)
    )

    if department:
        query = query.where(Employee.department == department)
    if status_filter:
        if status_filter == "absent":
            # Show employees with no attendance record
            query = query.where(AttendanceRecord.id.is_(None))
        else:
            query = query.where(AttendanceRecord.status == status_filter)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            (User.full_name.ilike(search_term))
            | (Employee.employee_code.ilike(search_term))
            | (User.email.ilike(search_term))
        )

    query = query.order_by(User.full_name)
    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "employee_id": str(row.employee_id),
            "employee_name": row.employee_name,
            "employee_code": row.employee_code,
            "employee_email": row.employee_email,
            "department": row.department or "Unassigned",
            "designation": row.designation or "—",
            "clock_in": row.clock_in.isoformat() if row.clock_in else None,
            "clock_out": row.clock_out.isoformat() if row.clock_out else None,
            "status": row.status.value if row.status else "absent",
            "total_hours": row.total_hours,
            "overtime_hours": row.overtime_hours or 0,
            "source": row.source.value if row.source else "—",
        }
        for row in rows
    ]


@router.get("/analytics")
async def get_analytics(
    days: int = Query(30, ge=1, le=365),
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """Get attendance analytics for charts — trends and department breakdown."""
    today = date.today()
    start_date = today - timedelta(days=days)

    # Total active employees
    total_result = await db.execute(
        select(func.count(Employee.id)).where(
            Employee.tenant_id == tenant_id,
            Employee.status == EmployeeStatus.ACTIVE,
        )
    )
    total_employees = total_result.scalar() or 0

    # Daily trend (last N days)
    daily_result = await db.execute(
        select(
            AttendanceRecord.date,
            func.count(AttendanceRecord.id).label("total"),
            func.sum(case((AttendanceRecord.status == AttendanceStatus.PRESENT, 1), else_=0)).label("present"),
            func.sum(case((AttendanceRecord.status == AttendanceStatus.LATE, 1), else_=0)).label("late"),
            func.sum(case((AttendanceRecord.status == AttendanceStatus.ON_LEAVE, 1), else_=0)).label("on_leave"),
        )
        .where(
            AttendanceRecord.tenant_id == tenant_id,
            AttendanceRecord.date >= start_date,
            AttendanceRecord.date <= today,
        )
        .group_by(AttendanceRecord.date)
        .order_by(AttendanceRecord.date)
    )
    daily_rows = daily_result.all()

    trend = [
        {
            "date": row.date.isoformat(),
            "present": int(row.present or 0),
            "late": int(row.late or 0),
            "on_leave": int(row.on_leave or 0),
            "absent": max(0, total_employees - int((row.present or 0) + (row.late or 0) + (row.on_leave or 0))),
        }
        for row in daily_rows
    ]

    # Department breakdown (today)
    dept_result = await db.execute(
        select(
            Employee.department,
            func.count(Employee.id).label("total"),
        )
        .where(
            Employee.tenant_id == tenant_id,
            Employee.status == EmployeeStatus.ACTIVE,
        )
        .group_by(Employee.department)
    )
    dept_rows = dept_result.all()

    department_stats = []
    for dept_row in dept_rows:
        dept_name = dept_row.department or "Unassigned"
        dept_total = dept_row.total

        # Get attendance for this department today
        dept_att = await db.execute(
            select(
                func.count(AttendanceRecord.id).label("total"),
                func.sum(case((AttendanceRecord.status == AttendanceStatus.PRESENT, 1), else_=0)).label("present"),
                func.sum(case((AttendanceRecord.status == AttendanceStatus.LATE, 1), else_=0)).label("late"),
                func.sum(case((AttendanceRecord.status == AttendanceStatus.ON_LEAVE, 1), else_=0)).label("on_leave"),
            )
            .select_from(Employee)
            .join(AttendanceRecord, and_(
                AttendanceRecord.employee_id == Employee.id,
                AttendanceRecord.date == today,
            ))
            .where(
                Employee.tenant_id == tenant_id,
                Employee.department == dept_name,
            )
        )
        dept_att_row = dept_att.one()
        present_count = int(dept_att_row.present or 0) + int(dept_att_row.late or 0)

        department_stats.append({
            "department": dept_name,
            "total_employees": dept_total,
            "present": present_count,
            "late": int(dept_att_row.late or 0),
            "on_leave": int(dept_att_row.on_leave or 0),
            "absent": max(0, dept_total - present_count - int(dept_att_row.on_leave or 0)),
        })

    return {
        "total_employees": total_employees,
        "trend": trend,
        "department_stats": department_stats,
    }


@router.get("/departments-list")
async def get_departments_list(
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)),
):
    """Get list of distinct departments for filters."""
    result = await db.execute(
        select(Employee.department).where(
            Employee.tenant_id == tenant_id,
            Employee.status == EmployeeStatus.ACTIVE,
            Employee.department.isnot(None),
        ).distinct()
    )
    departments = [row[0] for row in result.all() if row[0]]
    return {"departments": sorted(departments)}
