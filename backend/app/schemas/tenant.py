"""Pydantic schemas for tenants."""
from pydantic import BaseModel, Field
from typing import Optional, Any
from uuid import UUID
from datetime import datetime


class TenantCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-z0-9-]+$")


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    settings: Optional[dict[str, Any]] = None


class TenantResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    plan: str
    settings: dict[str, Any] = {}
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True