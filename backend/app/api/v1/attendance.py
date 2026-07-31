"""Attendance API routes."""
import uuid
from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.attendance import AttendanceRecord, AttendanceEvent, AttendanceStatus, AttendanceSource
from app.models.employee import Employee
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
    user: User = Depends(require_role(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN)),
):
    """Clock in for today."""
    emp_result = await db.execute(
        select(Employee).where(Employee.user_id == user.id, Employee.tenant_id == tenant_id)
    )
    employee = emp_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    today = date.today()

    if data.idempotency_key:
        existing = await db.execute(
            select(AttendanceRecord).where(AttendanceRecord.idempotency_key == data.idempotency_key)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Clock-in already recorded")

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
    user: User = Depends(require_role(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN)),
):
    """Clock out for today."""
    emp_result = await db.execute(
        select(Employee).where(Employee.user_id == user.id, Employee.tenant_id == tenant_id)
    )
    employee = emp_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")

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

    clock_in_dt = datetime.combine(today, record.clock_in)
    clock_out_dt = datetime.combine(today, now)
    total_minutes = (clock_out_dt - clock_in_dt).total_seconds() / 60
    total_hours = (total_minutes - record.break_minutes) / 60
    record.total_hours = round(total_hours, 2)

    if total_hours > 8:
        record.overtime_hours = round(total_hours - 8, 2)
        record.status = AttendanceStatus.OVERTIME

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


@router.get("/today", response_model=list[AttendanceTodayResponse])
async def get_today_attendance(
    tenant_id: UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(UserRole.ORG_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)),
):
    """Get today's attendance summary for all employees."""
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