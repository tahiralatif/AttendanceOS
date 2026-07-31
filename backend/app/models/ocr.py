"""OCR submission model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, JSON, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class OCRFileType(str, enum.Enum):
    EXCEL = "excel"
    CSV = "csv"
    PDF = "pdf"
    IMAGE = "image"


class OCRStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    REVIEW = "review"
    APPROVED = "approved"
    REJECTED = "rejected"
    IMPORTED = "imported"


class OCRSubmission(Base):
    __tablename__ = "ocr_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(SAEnum(OCRFileType), nullable=False)
    file_size = Column(Integer, nullable=True)
    status = Column(SAEnum(OCRStatus), nullable=False, default=OCRStatus.PENDING)
    extracted_data = Column(JSON, nullable=True)
    validated_data = Column(JSON, nullable=True)
    review_notes = Column(String(500), nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    confidence_score = Column(Float, nullable=True)
    processing_log = Column(JSON, nullable=True)
    error_message = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    uploader = relationship("User", foreign_keys=[uploaded_by])
    reviewer = relationship("User", foreign_keys=[reviewed_by])