"""Auth API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import UserRegister, UserLogin, TokenResponse, TokenRefresh, UserResponse
from app.services.auth import register_user, login_user, refresh_tokens
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user and create organization."""
    try:
        result = await register_user(
            db=db,
            email=data.email,
            password=data.password,
            full_name=data.full_name,
            org_name=data.organization_name,
            org_slug=data.organization_slug,
        )
        return TokenResponse(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    try:
        result = await login_user(db=db, email=data.email, password=data.password)
        return TokenResponse(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: TokenRefresh, db: AsyncSession = Depends(get_db)):
    """Refresh access token."""
    try:
        result = await refresh_tokens(db=db, refresh_token=data.refresh_token)
        return TokenResponse(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get current user profile."""
    return user