# 🏢 AttendanceOS

Enterprise-grade SaaS Attendance Management System with OCR, sync, and multi-tenant support.

## Features

- **Multi-tenant** — One platform, many organizations
- **OCR-powered import** — Upload Excel, CSV, PDF, or scanned images → auto-extract attendance data
- **Review pipeline** — Validate extracted data before saving
- **Google Sheets sync** — Live connection to existing spreadsheets
- **Clock in/out** — Web-based with geo-location tracking
- **Shift management** — Flexible shifts, rotations, swaps
- **Leave management** — Request, approve, balances
- **Reports** — Daily, monthly, absenteeism, overtime, custom
- **API-first** — RESTful API with webhooks for integrations

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + SQLAlchemy + PostgreSQL |
| Frontend | Next.js 14 + React + Tailwind + shadcn/ui |
| OCR | Tesseract + pdfplumber + OpenCV |
| Cache/Queue | Redis + Celery |
| Storage | S3 / MinIO |
| Auth | JWT + OAuth2 |

## Getting Started

```bash
# Clone
git clone https://github.com/tahiralatif/AttendanceOS.git
cd AttendanceOS

# Start with Docker
docker-compose up

# Access
# Frontend: http://localhost:3000
# API: http://localhost:8000/docs
```

## Documentation

- [Product Plan](PLAN.md) — Full architecture, features, database design, API spec
- API Docs — Available at `/docs` (Swagger UI) when running

## License

MIT
