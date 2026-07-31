# 🏢 AttendanceOS — Enterprise Attendance Management System

## Complete Product Plan v1.0

---

## 1. Product Vision

**What:** A multi-tenant SaaS attendance management platform that lets any company track, manage, and report employee attendance — with OCR-powered data import from Excel, CSV, PDF, and scanned images.

**Who:** HR teams, operations managers, system admins at SMBs to enterprises (10–10,000+ employees).

**Differentiator:** Not just another time clock. The OCR + review pipeline means companies with legacy paper/spreadsheet systems can digitize instantly — no rip-and-replace.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                        │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Web App  │  │ Mobile   │  │ Admin    │  │ Public  │ │
│  │ (React)  │  │ (PWA)    │  │ Portal   │  │ API     │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       └──────────────┼──────────────┼──────────────┘     │
└──────────────────────┼──────────────┼────────────────────┘
                       │              │
                ┌──────▼──────────────▼──────┐
                │      API GATEWAY            │
                │   (Rate Limit, Auth, etc.)   │
                └──────────────┬──────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
  ┌─────▼─────┐  ┌────────────▼────────────┐  ┌──────▼──────┐
  │ CORE API  │  │    OCR / AI SERVICE     │  │  SYNC       │
  │ SERVICE   │  │                        │  │  SERVICE     │
  │           │  │  - Image processing    │  │             │
  │ - Auth    │  │  - PDF extraction      │  │ - Google    │
  │ - Tenants │  │  - Excel/CSV parser    │  │   Sheets    │
  │ - Attend. │  │  - Review pipeline     │  │ - Excel     │
  │ - Reports │  │  - Validation engine   │  │   Connector │
  └─────┬─────┘  └────────────┬────────────┘  └──────┬──────┘
        │                     │                      │
        └─────────────────────┼──────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   DATA LAYER       │
                    │                    │
                    │  ┌──────────────┐  │
                    │  │  PostgreSQL   │  │
                    │  │  (primary DB) │  │
                    │  └──────────────┘  │
                    │  ┌──────────────┐  │
                    │  │  Redis        │  │
                    │  │  (cache/sessions)│
                    │  └──────────────┘  │
                    │  ┌──────────────┐  │
                    │  │  S3/MinIO     │  │
                    │  │  (file storage)│
                    │  └──────────────┘  │
                    │  ┌──────────────┐  │
                    │  │  Celery/RQ    │  │
                    │  │  (job queue)  │  │
                    │  └──────────────┘  │
                    └────────────────────┘
```

### Microservices Boundaries

| Service | Responsibility | Scaling |
|---|---|---|
| **Core API** | Auth, tenants, CRUD, attendance logic, reports | Horizontal |
| **OCR Service** | Image/PDF processing, data extraction, validation | Horizontal (CPU/GPU heavy) |
| **Sync Service** | Google Sheets API, Excel file watching, import/export | Horizontal |
| **Worker Pool** | Background jobs: OCR processing, report generation, email | Horizontal |

### Why This Split

- OCR is **expensive** (CPU/memory) — separate it so it doesn't slow down the main API
- Sync service handles external integrations (Google Sheets API has rate limits)
- Worker pool runs async jobs so uploads don't block the user

---

## 3. User Roles & Permissions

```
SUPER ADMIN (platform owner)
  └─ Manages all tenants, billing, platform config

ORG ADMIN (company admin)
  └─ Full access within their organization
  └─ Manages HR admins, settings, integrations

HR ADMIN
  └─ Manages employees, attendance records, leave
  └─ Reviews OCR submissions
  └─ Runs reports

MANAGER
  └─ Views team attendance
  └─ Approves corrections & overtime
  └─ Cannot access other teams

EMPLOYEE
  └─ Clocks in/out
  └─ Views own attendance
  └─ Submits corrections/requests
  └─ Uploads attendance sheets (if allowed)

API USER
  └─ Programmatic access via API key
  └─ Scoped permissions
```

### Permission Matrix (46 permissions across 8 modules)

| Module | Permissions |
|---|---|
| **Auth** | login, manage_own_profile, reset_password |
| **Tenant** | manage_org_settings, manage_billing, view_audit_log |
| **Employees** | create, view, edit, deactivate, import, export |
| **Attendance** | clock_in_out, view_own, view_team, view_all, edit, bulk_edit, override, approve_corrections |
| **Shifts** | create, assign, swap_approve, view_schedule |
| **Leave** | request, approve, cancel, view_balances, manage_policy |
| **OCR/Import** | upload, review, approve, reject, view_queue |
| **Reports** | view_summary, view_detailed, export, schedule_reports |

---

## 4. Database Design

### Core Entities

```
┌──────────────┐     ┌──────────────────┐
│   tenants     │     │   users          │
│──────────────│     │──────────────────│
│ id           │──┐  │ id               │
│ name         │  │  │ tenant_id (FK)   │──┐
│ slug         │  │  │ email            │  │
│ plan         │  │  │ password_hash    │  │
│ settings     │  │  │ role             │  │
│ created_at   │  │  │ status           │  │
└──────────────┘  │  │ created_at       │  │
                  │  └──────────────────┘  │
                  │                        │
┌──────────────┐  │  ┌──────────────────┐  │
│ departments  │  │  │   employees      │  │
│──────────────│  │  │──────────────────│  │
│ id           │──┘  │ id               │  │
│ tenant_id(FK)│     │ user_id (FK)     │──┘
│ name         │     │ tenant_id (FK)   │
│ manager_id   │     │ employee_id      │
│ created_at   │     │ department_id(FK)│
└──────────────┘     │ shift_id (FK)    │
                     │ join_date        │
                     │ status           │
                     └──────────────────┘

┌──────────────────────────┐
│   attendance_records      │
│──────────────────────────│
│ id                        │
│ employee_id (FK)          │
│ tenant_id (FK)            │
│ date                      │
│ clock_in                  │
│ clock_out                 │
│ break_minutes             │
│ total_hours               │
│ overtime_hours            │
│ status                    │
│ source                    │
│ ocr_submission_id (FK)    │
│ shift_id (FK)             │
│ location_in (lat/lng)     │
│ location_out (lat/lng)    │
│ ip_address                │
│ device_info               │
│ is_verified               │
│ created_at, updated_at    │
│ UNIQUE(employee_id, date) │
└──────────────────────────┘

┌──────────────────────────┐
│   ocr_submissions         │
│──────────────────────────│
│ id                        │
│ tenant_id (FK)            │
│ uploaded_by (FK → users)  │
│ file_url                  │
│ file_type                 │
│ status                    │
│ extracted_data (JSONB)    │
│ validated_data (JSONB)    │
│ review_notes              │
│ reviewed_by (FK)          │
│ reviewed_at               │
│ confidence_score          │
│ processing_log (JSONB)    │
│ created_at                │
└──────────────────────────┘

┌──────────────────────────┐
│   sync_configs            │
│──────────────────────────│
│ id                        │
│ tenant_id (FK)            │
│ source_type               │
│ source_id                 │
│ sync_frequency            │
│ last_synced_at            │
│ field_mapping (JSONB)     │
│ is_active                 │
│ created_at, updated_at    │
└──────────────────────────┘

┌──────────────────────────┐
│   shifts                  │
│──────────────────────────│
│ id                        │
│ tenant_id (FK)            │
│ name                      │
│ start_time, end_time      │
│ break_minutes             │
│ grace_period_minutes      │
│ is_flexible               │
│ created_at                │
└──────────────────────────┘

┌──────────────────────────┐
│   attendance_corrections  │
│──────────────────────────│
│ id                        │
│ attendance_record_id (FK) │
│ requested_by (FK)         │
│ approved_by (FK)          │
│ old_values (JSONB)        │
│ new_values (JSONB)        │
│ reason                    │
│ status                    │
│ created_at, resolved_at   │
└──────────────────────────┘

┌──────────────────────────┐
│   audit_log               │
│──────────────────────────│
│ id                        │
│ tenant_id (FK)            │
│ user_id (FK)              │
│ action                    │
│ entity_type               │
│ entity_id                 │
│ old_values (JSONB)        │
│ new_values (JSONB)        │
│ ip_address                │
│ created_at                │
└──────────────────────────┘
```

### Indexes for Performance

```sql
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX idx_attendance_tenant_date ON attendance_records(tenant_id, date);
CREATE INDEX idx_attendance_status ON attendance_records(tenant_id, status, date);
CREATE INDEX idx_ocr_status ON ocr_submissions(tenant_id, status);
CREATE INDEX idx_audit_entity ON audit_log(tenant_id, entity_type, entity_id);
```

---

## 5. Feature Roadmap

### Phase 1 — MVP (Weeks 1-4) 🏗️
```
✓ Multi-tenant auth (register, login, roles)
✓ Organization setup (company profile, departments)
✓ Employee management (CRUD, import from CSV)
✓ Manual attendance (admin marks present/absent)
✓ Employee self clock-in/clock-out (web)
✓ Basic attendance report (daily, monthly per employee)
✓ Single shift definition
```

### Phase 2 — OCR & Import (Weeks 5-8) 📄
```
✓ Excel/CSV upload + parsing
✓ PDF upload + text extraction
✓ Image upload + OCR (Tesseract + cloud fallback)
✓ OCR review dashboard (side-by-side: original + extracted)
✓ Confidence scoring + human validation
✓ Bulk approve/reject/import from OCR results
✓ Field mapping UI (user maps columns → attendance fields)
✓ Import history & audit trail
```

### Phase 3 — Sync & Integrations (Weeks 9-11) 🔄
```
✓ Google Sheets live connection (OAuth2)
✓ Excel file auto-sync (watch for changes)
✓ API endpoints for external clock systems
✓ Webhook support (push attendance events)
✓ Scheduled sync with configurable frequency
✓ Export to Excel/CSV/PDF
```

### Phase 4 — Advanced Features (Weeks 12-16) 🚀
```
✓ Shift management (create, assign, rotate, swap)
✓ Overtime rules engine (configurable per org)
✓ Leave management (request, approve, balances)
✓ Geo-fenced mobile clock-in (PWA)
✓ Facial recognition clock-in (optional, ML)
✓ Multi-location support
✓ Real-time dashboard (WebSocket updates)
✓ Email/SMS notifications (no-show alerts, shift reminders)
✓ Leave calendar view
✓ Department/team rollup reports
✓ Manager approval workflows
```

### Phase 5 — Enterprise (Weeks 17-20) 🏢
```
✓ Payroll export integration
✓ Custom report builder
✓ Scheduled report emails
✓ SSO (SAML/OIDC)
✓ API rate limiting + API key management
✓ Bulk operations (bulk edit, bulk approve)
✓ Audit log viewer (admin)
✓ Compliance reports (labor law adherence)
✓ Multi-country timezone support
✓ White-label option
```

### Phase 6 — Scale & Polish (Weeks 21-24) 📈
```
✓ Performance optimization (caching, query optimization)
✓ Mobile app (React Native or enhanced PWA)
✓ Advanced analytics (absenteeism trends, patterns)
✓ AI-powered predictions (no-show probability, optimal scheduling)
✓ Marketplace integrations (Slack, Teams, Zapier)
✓ Documentation + onboarding flow
✓ Billing/subscription management
```

---

## 6. API Structure

### RESTful Endpoints

```
BASE: /api/v1

── AUTH ──
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password

── TENANTS ──
GET    /tenants/:id
PUT    /tenants/:id
GET    /tenants/:id/audit-log

── EMPLOYEES ──
GET    /employees
POST   /employees
GET    /employees/:id
PUT    /employees/:id
DELETE /employees/:id
POST   /employees/import
GET    /employees/export

── ATTENDANCE ──
POST   /attendance/clock-in
POST   /attendance/clock-out
GET    /attendance
GET    /attendance/:id
PUT    /attendance/:id
POST   /attendance/bulk-edit
GET    /attendance/summary
GET    /attendance/today

── OCR / IMPORT ──
POST   /ocr/upload
GET    /ocr/submissions
GET    /ocr/submissions/:id
PUT    /ocr/submissions/:id/review
POST   /ocr/submissions/:id/import
DELETE /ocr/submissions/:id

── SYNC ──
POST   /sync/google-sheets
GET    /sync/configs
PUT    /sync/configs/:id
POST   /sync/configs/:id/trigger
GET    /sync/logs

── SHIFTS ──
GET    /shifts
POST   /shifts
PUT    /shifts/:id
DELETE /shifts/:id
POST   /shifts/:id/assign

── LEAVE ──
GET    /leave/policies
POST   /leave/request
GET    /leave/requests
PUT    /leave/requests/:id/approve
PUT    /leave/requests/:id/reject
GET    /leave/balances

── REPORTS ──
GET    /reports/attendance
GET    /reports/summary
GET    /reports/absenteeism
GET    /reports/overtime
GET    /reports/export

── WEBHOOKS ──
POST   /webhooks
GET    /webhooks
DELETE /webhooks/:id

── ADMIN ──
GET    /admin/tenants
GET    /admin/health
GET    /admin/metrics
```

### Key API Patterns

```
- JWT auth with refresh tokens (24h + 7d)
- Multi-tenant: every query scoped by tenant_id from JWT
- Pagination: cursor-based for large datasets
- Rate limiting: 100 req/min per tenant (configurable)
- Idempotency keys for clock-in/out (prevent duplicates)
- Webhook events: attendance.clocked_in, attendance.marked_absent, ocr.submission_created, etc.
```

---

## 7. UI/UX Modules

### Screen Map

```
┌─ PUBLIC ──────────────────────────────────┐
│  Landing Page, Pricing, Login, Register   │
└───────────────────────────────────────────┘

┌─ SUPER ADMIN ─────────────────────────────┐
│  Tenant List, Platform Config, Metrics    │
└───────────────────────────────────────────┘

┌─ ORG DASHBOARD ───────────────────────────┐
│                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Today's   │ │ Currently│ │Pending   │  │
│  │Summary   │ │Checked In│ │Actions   │  │
│  │Present   │ │ 45/60    │ │(correc-  │  │
│  │Absent    │ │          │ │tions,    │  │
│  │Late      │ │ ████████ │ │leaves)   │  │
│  └──────────┘ └──────────┘ └──────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Real-time attendance heatmap        │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────┐ ┌────────────────────┐  │
│  │ Recent       │ │ Quick Actions      │  │
│  │ Activity     │ │ ▸ Mark Attendance  │  │
│  │ Feed         │ │ ▸ Upload Sheet     │  │
│  │              │ │ ▸ Run Report       │  │
│  └──────────────┘ └────────────────────┘  │
└───────────────────────────────────────────┘

┌─ ATTENDANCE MODULE ───────────────────────┐
│  Toggle: [Today] [Calendar] [List] [Heatmap] │
│  Calendar View with color-coded status    │
│  Clock In/Out Widget                      │
└───────────────────────────────────────────┘

┌─ OCR REVIEW MODULE ──────────────────────┐
│  Upload Area (drag & drop)                │
│  Side-by-side review (original + extracted)│
│  Confidence scoring + validation errors   │
│  Accept All / Review Each / Reject        │
└───────────────────────────────────────────┘

┌─ SYNC MODULE ─────────────────────────────┐
│  Google Sheets Connection                 │
│  Field Mapping UI                         │
│  Sync status & history                    │
└───────────────────────────────────────────┘

┌─ REPORTS MODULE ─────────────────────────┐
│  Report Builder (type, date, dept, etc.)  │
│  Results (charts + table)                 │
│  Export: PDF / Excel / Scheduled Email    │
└───────────────────────────────────────────┘
```

### Design System

```
Color Palette:
  Primary:    #2563EB (blue-600) — trust, professionalism
  Secondary:  #10B981 (emerald)  — success/present
  Danger:     #EF4444 (red)      — absent/error
  Warning:    #F59E0B (amber)    — late/pending
  Surface:    #F8FAFC (slate-50) — background
  Text:       #0F172A (slate-900)

Typography: Inter (clean, professional)
Components: shadcn/ui (consistent, accessible)
Responsive: Mobile-first, works on tablets for kiosk mode
```

---

## 8. AI/OCR Workflow

### Processing Pipeline

```
FILE UPLOAD
    │
    ▼
┌─ ROUTER ──────────────────────────┐
│  Detect file type                 │
│  ├─ .xlsx/.xls/.csv → Excel Parser│
│  ├─ .pdf            → PDF Extractor│
│  └─ .jpg/.png/.tiff → Image OCR   │
└───────────┬───────────────────────┘
            │
    ┌───────▼────────┐
    │  EXTRACT DATA   │
    │  Excel: openpyxl│
    │  PDF: pdfplumber │
    │  Image: Tesseract│
    │    + cloud API   │
    └───────┬─────────┘
            │
    ┌───────▼────────────┐
    │  NORMALIZE          │
    │  - Parse dates      │
    │  - Parse times      │
    │  - Match employees  │
    │  - Handle timezone  │
    │  - Detect headers   │
    └───────┬─────────────┘
            │
    ┌───────▼────────────┐
    │  VALIDATE           │
    │  - Required fields  │
    │  - Date range valid │
    │  - Employee exists  │
    │  - Clock-out > in   │
    │  - Duplicate check  │
    │  - Confidence score │
    └───────┬─────────────┘
            │
    ┌───────▼────────────┐
    │  STAGE FOR REVIEW   │
    │  - Store raw data   │
    │  - Store validated  │
    │  - Mark: pending_review │
    │  - Notify reviewer  │
    └───────┬─────────────┘
            │
    ┌───────▼────────────┐
    │  HUMAN REVIEW       │
    │  Side-by-side view  │
    │  Accept / Edit / Reject │
    └───────┬─────────────┘
            │
    ┌───────▼────────────┐
    │  IMPORT             │
    │  Write attendance_records │
    │  Log to audit_log   │
    │  Notify affected    │
    └────────────────────┘
```

### OCR Engine Strategy

```
Tier 1 (Default - Free, Self-hosted):
  Tesseract OCR (open source)
  pdfplumber (PDF text extraction)
  openpyxl / pandas (Excel/CSV)

Tier 2 (Fallback - Cloud APIs):
  Google Cloud Vision API
  AWS Textract
  Azure Computer Vision
  (Triggered when Tesseract confidence < 70%)

Tier 3 (Future - AI-Enhanced):
  GPT-4 Vision for complex layouts
  Custom ML model trained on attendance sheets
```

### Confidence Scoring

```python
# Confidence calculation factors:
confidence = (
    header_detection_confidence * 0.20 +
    employee_match_confidence   * 0.25 +
    date_parse_confidence       * 0.20 +
    time_parse_confidence       * 0.25 +
    structural_consistency      * 0.10
)

# Thresholds:
# > 85%: Auto-approve eligible (if org setting enabled)
# 70-85%: Queue for human review
# < 70%: Flag as low confidence, require manual entry
```

---

## 9. Technology Stack

### Backend

| Component | Technology | Why |
|---|---|---|
| **Framework** | FastAPI (Python) | Async, fast, great for APIs, auto-docs |
| **ORM** | SQLAlchemy 2.0 (async) | Mature, flexible, async support |
| **Database** | PostgreSQL | Multi-tenant, JSONB, full-text search |
| **Cache** | Redis | Sessions, rate limiting, job queue |
| **Task Queue** | Celery + Redis | Async OCR processing, reports |
| **File Storage** | S3 / MinIO | Uploaded files, OCR results |
| **Auth** | JWT + bcrypt + OAuth2 | Secure, industry standard |

### OCR & File Processing

| Component | Technology | Why |
|---|---|---|
| **Excel/CSV** | openpyxl + pandas | Robust parsing, handles edge cases |
| **PDF** | pdfplumber + PyMuPDF | Text extraction + table detection |
| **Image OCR** | Tesseract (pytesseract) | Free, self-hosted, good enough for most |
| **Cloud OCR** | Google Vision / AWS Textract | Fallback for complex/bad quality docs |
| **Image Processing** | Pillow + OpenCV | Pre-processing (deskew, enhance, binarize) |

### Frontend

| Component | Technology | Why |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | React + SSR + great DX |
| **UI Library** | shadcn/ui + Tailwind CSS | Consistent, accessible, customizable |
| **Charts** | Recharts / Tremor | Dashboard visualizations |
| **Forms** | React Hook Form + Zod | Validation, performance |
| **State** | Zustand or TanStack Query | Server state management |

### DevOps & Infrastructure

| Component | Technology | Why |
|---|---|---|
| **Containerization** | Docker + Docker Compose | Consistent environments |
| **CI/CD** | GitHub Actions | Free for public, integrates with repo |
| **Deployment** | Docker → VPS or AWS ECS | Flexible, cost-controlled |
| **Monitoring** | Prometheus + Grafana | Metrics, dashboards |
| **Logging** | Structured JSON logs | Searchable, parseable |

---

## 10. Project Structure

```
AttendanceOS/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app
│   │   ├── config.py                  # Settings & env
│   │   ├── database.py                # DB connection
│   │   ├── models/                    # SQLAlchemy models
│   │   │   ├── tenant.py
│   │   │   ├── user.py
│   │   │   ├── employee.py
│   │   │   ├── attendance.py
│   │   │   ├── ocr.py
│   │   │   ├── shift.py
│   │   │   ├── leave.py
│   │   │   └── audit.py
│   │   ├── schemas/                   # Pydantic schemas
│   │   ├── api/                       # API routes
│   │   │   ├── v1/
│   │   │   │   ├── auth.py
│   │   │   │   ├── tenants.py
│   │   │   │   ├── employees.py
│   │   │   │   ├── attendance.py
│   │   │   │   ├── ocr.py
│   │   │   │   ├── sync.py
│   │   │   │   ├── shifts.py
│   │   │   │   ├── leave.py
│   │   │   │   └── reports.py
│   │   │   └── deps.py                # Dependencies
│   │   ├── services/                  # Business logic
│   │   │   ├── auth.py
│   │   │   ├── attendance.py
│   │   │   ├── ocr_engine.py
│   │   │   ├── file_parser.py
│   │   │   ├── sync_engine.py
│   │   │   └── report_engine.py
│   │   ├── middleware/                 # Middleware
│   │   │   ├── tenant.py
│   │   │   └── rate_limit.py
│   │   └── utils/                     # Helpers
│   │       ├── security.py
│   │       └── validators.py
│   ├── alembic/                       # DB migrations
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/                       # Next.js pages
│   │   ├── components/                # UI components
│   │   ├── hooks/                     # Custom hooks
│   │   ├── lib/                       # Utilities
│   │   ├── stores/                    # State management
│   │   └── types/                     # TypeScript types
│   ├── public/
│   ├── package.json
│   └── Dockerfile
│
├── worker/                            # Celery workers
│   ├── tasks/
│   │   ├── ocr_processing.py
│   │   ├── report_generation.py
│   │   └── sync_tasks.py
│   └── Dockerfile
│
├── docker-compose.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── ARCHITECTURE.md
├── PLAN.md                            # This file
├── README.md
├── .env.example
└── .gitignore
```

---

## 11. Security Considerations

```
- Multi-tenant data isolation (row-level security in PostgreSQL)
- JWT tokens with short expiry + refresh rotation
- Rate limiting per tenant and per IP
- Input validation on all endpoints (Pydantic)
- SQL injection prevention (SQLAlchemy ORM)
- File upload validation (type, size, virus scan)
- OCR files stored in isolated S3 buckets
- Audit logging on all data mutations
- Password hashing with bcrypt
- CORS configured per environment
- CSP headers on frontend
- HTTPS enforced in production
- API key management for external integrations
```

---

## 12. Deployment Strategy

```
Development:
  docker-compose up (full stack local)

Staging:
  Docker images → staging server
  Auto-deploy on main branch push

Production:
  Docker images → production server
  Manual promote from staging
  Database migrations via Alembic
  Blue-green deployment (zero downtime)
  Health checks + auto-restart
  Backups: daily PostgreSQL + S3
```

---

## 13. Estimated Timeline

| Phase | Duration | Key Deliverables |
|---|---|---|
| Phase 1: MVP | Weeks 1-4 | Auth, employees, basic attendance, clock-in/out |
| Phase 2: OCR | Weeks 5-8 | File upload, OCR pipeline, review dashboard |
| Phase 3: Sync | Weeks 9-11 | Google Sheets, Excel sync, API, webhooks |
| Phase 4: Advanced | Weeks 12-16 | Shifts, OT rules, leave, PWA, real-time |
| Phase 5: Enterprise | Weeks 17-20 | SSO, compliance, custom reports, white-label |
| Phase 6: Scale | Weeks 21-24 | Mobile app, AI predictions, integrations |

**Total: ~24 weeks (6 months) to full feature set**

---

*Last updated: July 31, 2026*
