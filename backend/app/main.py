"""AttendanceOS — Enterprise Attendance Management System."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
from app.api.v1.auth import router as auth_router
from app.api.v1.employees import router as employees_router
from app.api.v1.attendance import router as attendance_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise-grade SaaS Attendance Management System",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(employees_router, prefix=settings.API_V1_PREFIX)
app.include_router(attendance_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }