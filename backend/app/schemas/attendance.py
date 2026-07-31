"""Pydantic schemas for attendance."""
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import date, time, datetime
from app.models.attendance import AttendanceStatus, AttendanceSource


class ClockInRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    device_info: Optional[str] = None
    idempotency_key: Optional[str] = None


class ClockOutRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AttendanceRecordCreate(BaseModel):
    employee_id: UUID
    date: date
    clock_in: Optional[time] = None
    clock_out: Optional[time] = None
    status: AttendanceStatus
    source: AttendanceSource = AttendanceSource.MANUAL
    notes: Optional[str] = None


class AttendanceRecordUpdate(BaseModel):
    clock_in: Optional[time] = None
    clock_out: Optional[time] = None
    status: Optional[AttendanceStatus] = None
    notes: Optional[str] = None


class AttendanceRecordResponse(BaseModel):
    id: UUID
    employee_id: UUID
    tenant_id: UUID
    date: date
    clock_in: Optional[time] = None
    clock_out: Optional[time] = None
    break_minutes: int = 0
    total_hours: Optional[float] = None
    overtime_hours: float = 0
    status: AttendanceStatus
    source: AttendanceSource
    is_verified: bool
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AttendanceTodayResponse(BaseModel):
    employee_id: UUID
    employee_name: str
    employee_code: str
    clock_in: Optional[time] = None
    clock_out: Optional[time] = None
    status: str
    total_hours: Optional[float] = None
    is_clocked_in: bool


class AttendanceSummary(BaseModel):
    date: date
    total_employees: int
    present: int
    absent: int
    late: int
    on_leave: int
    half_day: int