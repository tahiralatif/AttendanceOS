"""API dependencies: current user, tenant, permissions."""
from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.utils.security import decode_token


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate current user from JWT."""
    token = credentials.credentials
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = UUID(payload["sub"])
    result = await db.execute(
        select(User).where(User.id == user_id).options(selectinload(User.tenant))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


async def get_current_tenant(user: User = Depends(get_current_user)) -> UUID:
    """Get current tenant ID from user."""
    if not user.tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No organization associated")
    return user.tenant_id


def require_role(*roles: UserRole):
    """Dependency that checks user has one of the specified roles."""
    async def role_checker(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {', '.join(r.value for r in roles)}",
            )
        return user
    return role_checker
