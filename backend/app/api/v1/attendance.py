"""Attendance API routes."""
import uuid
from uuid import UUID
from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.attendance import AttendanceRecord, AttendanceEvent, AttendanceStatus, AttendanceSource
from app.models.employee import Employee, EmployeeStatus
from app.models.user import User, UserRole
from app.schemas.attendance import (
    ClockInRequest, ClockOutRequest,
    AttendanceRecordResponse, AttendanceTodayResponse, AttendanceSummary,
)
from app.api.deps import get_current_user, get_current_tenant, require_role

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/clock-in", response_model=AttendanceRecordResponse)
async def clock_in(
    data: ClockInRequest,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Clock in for today. Auto-creates employee profile if missing."""
    # Find or create employee profile
    emp_result = await db.execute(
        select(Employee).where(Employee.user_id == user.id, Employee.tenant_id == tenant_id)
    )
    employee = emp_result.scalar_one_or_none()
    if not employee:
        import random
        emp_code = f"EMP-{random.randint(1000, 9999)}"
        employee = Employee(
            user_id=user.id,
            tenant_id=tenant_id,
            employee_code=emp_code,
            join_date=date.today(),
            status=EmployeeStatus.ACTIVE,
        )
        db.add(employee)
        await db.flush()

    today = date.today()

    # Check idempotency
    if data.idempotency_key:
        existing = await db.execute(
            select(AttendanceRecord).where(AttendanceRecord.idempotency_key == data.idempotency_key)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Clock-in already recorded")

    # Check if already clocked in today
    existing_today = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.employee_id == employee.id,
            AttendanceRecord.date == today,
        )
    )
    existing_record = existing_today.scalar_one_or_none()

    now = datetime.now().time()

    if existing_record:
        if existing_record.clock_in:
            raise HTTPException(status_code=400, detail="Already clocked in today")
        # Update existing absent record
        existing_record.clock_in = now
        existing_record.source = AttendanceSource.WEB_CLOCK
        if data.latitude and data.longitude:
            existing_record.location_in = {"lat": data.latitude, "lng": data.longitude}
        if data.device_info:
            existing_record.device_info = data.device_info
        if data.idempotency_key:
            existing_record.idempotency_key = data.idempotency_key
        record = existing_record
    else:
        # Create new record
        record = AttendanceRecord(
            employee_id=employee.id,
            tenant_id=tenant_id,
            date=today,
            clock_in=now,
            status=AttendanceStatus.PRESENT,
            source=AttendanceSource.WEB_CLOCK,
            location_in={"lat": data.latitude, "lng": data.longitude} if data.latitude else None,
            device_info=data.device_info,
            idempotency_key=data.idempotency_key or str(uuid.uuid4()),
        )
        db.add(record)
        await db.flush()

    # Create event
    event = AttendanceEvent(
        attendance_id=record.id,
        tenant_id=tenant_id,
        event_type="clock_in",
        payload={"clock_in": now.isoformat(), "source": "web_clock"},
        actor_id=user.id,
        source="web_clock",
    )
    db.add(event)

    await db.flush()
    return record


@router.post("/clock-out", response_model=AttendanceRecordResponse)
async def clock_out(
    data: ClockOutRequest,
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Clock out for today."""
    emp_result = await db.execute(
        select(Employee).where(Employee.user_id == user.id, Employee.tenant_id == tenant_id)
    )
    employee = emp_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found. Clock in first.")

    today = date.today()
    now = datetime.now().time()

    result = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.employee_id == employee.id,
            AttendanceRecord.date == today,
        )
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=400, detail="No clock-in record for today")
    if record.clock_out:
        raise HTTPException(status_code=400, detail="Already clocked out today")
    if not record.clock_in:
        raise HTTPException(status_code=400, detail="Must clock in before clocking out")

    record.clock_out = now
    if data.latitude and data.longitude:
        record.location_out = {"lat": data.latitude, "lng": data.longitude}

    # Calculate total hours
    clock_in_dt = datetime.combine(today, record.clock_in)
    clock_out_dt = datetime.combine(today, now)
    total_minutes = (clock_out_dt - clock_in_dt).total_seconds() / 60
    total_hours = (total_minutes - record.break_minutes) / 60
    record.total_hours = round(total_hours, 2)

    # Calculate overtime (if > 8 hours)
    if total_hours > 8:
        record.overtime_hours = round(total_hours - 8, 2)
        record.status = AttendanceStatus.OVERTIME

    # Create event
    event = AttendanceEvent(
        attendance_id=record.id,
        tenant_id=tenant_id,
        event_type="clock_out",
        payload={
            "clock_out": now.isoformat(),
            "total_hours": record.total_hours,
            "overtime_hours": record.overtime_hours,
        },
        actor_id=user.id,
        source="web_clock",
    )
    db.add(event)

    await db.flush()
    return record


@router.get("/my-status", response_model=AttendanceTodayResponse)
async def get_my_status(
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get current user's clock-in status for today."""
    today = date.today()

    emp_result = await db.execute(
        select(Employee).where(Employee.user_id == user.id, Employee.tenant_id == tenant_id)
    )
    employee = emp_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    record_result = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.employee_id == employee.id,
            AttendanceRecord.date == today,
        ).order_by(AttendanceRecord.created_at.desc()).limit(1)
    )
    record = record_result.scalar_one_or_none()

    if record:
        return AttendanceTodayResponse(
            employee_id=employee.id,
            employee_name=user.full_name,
            employee_code=employee.employee_code or "",
            clock_in=record.clock_in,
            clock_out=record.clock_out,
            status=record.status.value if record.status else "absent",
            total_hours=record.total_hours,
            is_clocked_in=record.clock_in is not None and record.clock_out is None,
        )

    return AttendanceTodayResponse(
        employee_id=employee.id,
        employee_name=user.full_name,
        employee_code=employee.employee_code or "",
        clock_in=None,
        clock_out=None,
        status="absent",
        total_hours=None,
        is_clocked_in=False,
    )


@router.get("/today", response_model=list[AttendanceTodayResponse])
async def get_today_attendance(
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)),
):
    """Get today's attendance for all employees (admin/manager only)."""
    today = date.today()

    query = (
        select(
            Employee.id.label("employee_id"),
            User.full_name.label("employee_name"),
            Employee.employee_code,
            AttendanceRecord.clock_in,
            AttendanceRecord.clock_out,
            AttendanceRecord.status,
            AttendanceRecord.total_hours,
        )
        .select_from(Employee)
        .join(User, Employee.user_id == User.id)
        .outerjoin(
            AttendanceRecord,
            and_(
                AttendanceRecord.employee_id == Employee.id,
                AttendanceRecord.date == today,
            ),
        )
        .where(Employee.tenant_id == tenant_id, Employee.status == "active")
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        AttendanceTodayResponse(
            employee_id=row.employee_id,
            employee_name=row.employee_name,
            employee_code=row.employee_code,
            clock_in=row.clock_in,
            clock_out=row.clock_out,
            status=row.status.value if row.status else "absent",
            total_hours=row.total_hours,
            is_clocked_in=row.clock_in is not None and row.clock_out is None,
        )
        for row in rows
    ]


@router.get("/summary", response_model=AttendanceSummary)
async def get_summary(
    target_date: date = Query(default=None),
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN)),
):
    """Get attendance summary for a specific date."""
    if target_date is None:
        target_date = date.today()

    total = await db.execute(
        select(func.count(Employee.id)).where(
            Employee.tenant_id == tenant_id,
            Employee.status == "active",
        )
    )
    total_employees = total.scalar() or 0

    status_counts = await db.execute(
        select(AttendanceRecord.status, func.count(AttendanceRecord.id))
        .where(
            AttendanceRecord.tenant_id == tenant_id,
            AttendanceRecord.date == target_date,
        )
        .group_by(AttendanceRecord.status)
    )

    counts = {row[0]: row[1] for row in status_counts.all()}

    return AttendanceSummary(
        date=target_date,
        total_employees=total_employees,
        present=counts.get(AttendanceStatus.PRESENT, 0) + counts.get(AttendanceStatus.OVERTIME, 0),
        absent=max(0, total_employees - sum(counts.values())),
        late=counts.get(AttendanceStatus.LATE, 0),
        on_leave=counts.get(AttendanceStatus.ON_LEAVE, 0),
        half_day=counts.get(AttendanceStatus.HALF_DAY, 0),
    )


@router.get("/my-history")
async def get_my_history(
    days: int = Query(30, ge=1, le=90),
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get current user's attendance history."""
    emp_result = await db.execute(
        select(Employee).where(Employee.user_id == user.id, Employee.tenant_id == tenant_id)
    )
    employee = emp_result.scalar_one_or_none()
    if not employee:
        return {"records": [], "summary": {}}

    start = date.today() - timedelta(days=days)
    result = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.employee_id == employee.id,
            AttendanceRecord.date >= start,
        ).order_by(AttendanceRecord.date.desc())
    )
    records = result.scalars().all()

    # Calculate summary
    total_days = len(records)
    present_days = sum(1 for r in records if r.status in (AttendanceStatus.PRESENT, AttendanceStatus.OVERTIME))
    late_days = sum(1 for r in records if r.status == AttendanceStatus.LATE)
    leave_days = sum(1 for r in records if r.status == AttendanceStatus.ON_LEAVE)
    total_hours = sum(r.total_hours or 0 for r in records)
    total_overtime = sum(r.overtime_hours or 0 for r in records)

    return {
        "records": [
            {
                "date": r.date.isoformat(),
                "clock_in": r.clock_in.isoformat() if r.clock_in else None,
                "clock_out": r.clock_out.isoformat() if r.clock_out else None,
                "status": r.status.value,
                "total_hours": r.total_hours,
                "overtime_hours": r.overtime_hours,
            }
            for r in records
        ],
        "summary": {
            "total_days": total_days,
            "present_days": present_days,
            "late_days": late_days,
            "leave_days": leave_days,
            "total_hours": round(total_hours, 1),
            "total_overtime": round(total_overtime, 1),
            "avg_hours": round(total_hours / max(present_days, 1), 1),
        },
    }


@router.get("", response_model=list[AttendanceRecordResponse])
async def list_attendance(
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    employee_id: Optional[UUID] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status_filter: Optional[AttendanceStatus] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(get_current_user),
):
    """List attendance records with filters."""
    query = select(AttendanceRecord).where(AttendanceRecord.tenant_id == tenant_id)

    # Employees can only see their own records
    if user.role.value == "employee":
        emp_result = await db.execute(
            select(Employee).where(Employee.user_id == user.id)
        )
        emp = emp_result.scalar_one_or_none()
        if emp:
            query = query.where(AttendanceRecord.employee_id == emp.id)
        else:
            return []

    if employee_id:
        query = query.where(AttendanceRecord.employee_id == employee_id)
    if start_date:
        query = query.where(AttendanceRecord.date >= start_date)
    if end_date:
        query = query.where(AttendanceRecord.date <= end_date)
    if status_filter:
        query = query.where(AttendanceRecord.status == status_filter)

    query = query.order_by(AttendanceRecord.date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
