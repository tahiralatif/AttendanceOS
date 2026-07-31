"""Pydantic schemas for employees."""
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import date, datetime
from app.models.employee import EmployeeStatus


class EmployeeCreate(BaseModel):
    user_id: UUID
    employee_code: str = Field(..., min_length=1, max_length=50)
    department: Optional[str] = None
    designation: Optional[str] = None
    join_date: date


class EmployeeUpdate(BaseModel):
    department: Optional[str] = None
    designation: Optional[str] = None
    status: Optional[EmployeeStatus] = None
    manager_id: Optional[UUID] = None


class EmployeeResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    user_id: UUID
    employee_code: str
    department: Optional[str] = None
    designation: Optional[str] = None
    join_date: date
    status: EmployeeStatus
    created_at: datetime

    class Config:
        from_attributes = True