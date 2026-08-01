"""Pydantic schemas for users."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole, UserStatus


# --- Auth ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    organization_name: str = Field(..., min_length=2, max_length=255)
    organization_slug: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-z0-9-]+$")


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    tenant_slug: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


# --- User Profile ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    status: UserStatus


class UserResponse(UserBase):
    id: UUID
    tenant_id: Optional[UUID] = None
    is_email_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
