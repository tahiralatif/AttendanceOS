"""Auth service: registration, login, token management."""
import re
from uuid import UUID
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User, UserRole, UserStatus
from app.models.tenant import Tenant
from app.utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)


def generate_slug(name: str) -> str:
    """Auto-generate a tenant slug from organization name."""
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    if len(slug) > 40:
        slug = slug[:40]
    return slug


async def register_user(db: AsyncSession, email: str, password: str, full_name: str,
                        org_name: str, org_slug: str = None) -> dict:
    """Register a new user and organization."""
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise ValueError("Email already registered")

    # Auto-generate slug if not provided
    if not org_slug:
        org_slug = generate_slug(org_name)
        if not org_slug:
            org_slug = "org"

    # Check if slug is taken; if so, append random suffix
    existing_slug = await db.execute(select(Tenant).where(Tenant.slug == org_slug))
    if existing_slug.scalar_one_or_none():
        import secrets as _secrets
        suffix = _secrets.token_hex(3)
        org_slug = f"{org_slug}-{suffix}"

    # Create tenant
    tenant = Tenant(name=org_name, slug=org_slug)
    db.add(tenant)
    await db.flush()  # Get tenant ID

    # Create user (org admin)
    user = User(
        tenant_id=tenant.id,
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        role=UserRole.ORG_ADMIN,
        status=UserStatus.ACTIVE,
        is_email_verified=True,  # Auto-verify for now
    )
    db.add(user)
    await db.flush()

    # Generate tokens
    access_token = create_access_token(user.id, tenant.id, user.role.value)
    refresh_token = create_refresh_token(user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user,
        "tenant": tenant,
    }


async def login_user(db: AsyncSession, email: str, password: str) -> dict:
    """Authenticate user and return tokens."""
    result = await db.execute(
        select(User).where(User.email == email).options(selectinload(User.tenant))
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise ValueError("Invalid email or password")

    if user.status != UserStatus.ACTIVE:
        raise ValueError("Account is not active")

    # Update last login
    user.last_login = datetime.utcnow()

    # Generate tokens
    access_token = create_access_token(user.id, user.tenant_id, user.role.value)
    refresh_token = create_refresh_token(user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user,
    }


async def refresh_tokens(db: AsyncSession, refresh_token: str) -> dict:
    """Refresh access token using refresh token."""
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise ValueError("Invalid refresh token")

    user_id = UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or user.status != UserStatus.ACTIVE:
        raise ValueError("User not found or inactive")

    access_token = create_access_token(user.id, user.tenant_id, user.role.value)
    new_refresh = create_refresh_token(user.id)

    return {
        "access_token": access_token,
        "refresh_token": new_refresh,
    }
