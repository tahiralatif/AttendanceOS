"""Attendance record model with event sourcing."""
import uuid
from datetime import datetime, date, time
from sqlalchemy import Column, String, DateTime, Date, Time, Float, Integer, ForeignKey, Enum as SAEnum, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    HALF_DAY = "half_day"
    LATE = "late"
    ON_LEAVE = "on_leave"
    HOLIDAY = "holiday"
    WEEKEND = "weekend"
    OVERTIME = "overtime"
    CONFLICT = "conflict"


class AttendanceSource(str, enum.Enum):
    MANUAL = "manual"
    WEB_CLOCK = "web_clock"
    MOBILE_GPS = "mobile_gps"
    BIOMETRIC = "biometric"
    API = "api"
    OCR = "ocr"
    SYNC = "sync"


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    clock_in = Column(Time, nullable=True)
    clock_out = Column(Time, nullable=True)
    break_minutes = Column(Integer, default=0)
    total_hours = Column(Float, nullable=True)
    overtime_hours = Column(Float, default=0)
    status = Column(SAEnum(AttendanceStatus), nullable=False, default=AttendanceStatus.ABSENT)
    source = Column(SAEnum(AttendanceSource), nullable=False, default=AttendanceSource.MANUAL)
    ocr_submission_id = Column(UUID(as_uuid=True), ForeignKey("ocr_submissions.id"), nullable=True)
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.id"), nullable=True)
    location_in = Column(JSON, nullable=True)
    location_out = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    device_info = Column(String(255), nullable=True)
    idempotency_key = Column(String(255), unique=True, nullable=True, index=True)
    is_verified = Column(Boolean, default=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        {"comment": "Core attendance records with event sourcing support"},
    )


class AttendanceEvent(Base):
    """Immutable event log for attendance changes (event sourcing)."""
    __tablename__ = "attendance_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attendance_id = Column(UUID(as_uuid=True), ForeignKey("attendance_records.id"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    event_type = Column(String(50), nullable=False)
    payload = Column(JSON, nullable=False)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    source = Column(String(50), nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)