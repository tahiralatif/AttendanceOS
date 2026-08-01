# AttendanceOS — Phase 2: Enterprise Architecture

## Architecture Overview

### Role-Based Dashboards
- **Admin/OrgAdmin/HR/Manager** → `/admin` — Company-wide dashboard
- **Employee** → `/employee` — Personal dashboard

### Backend API Structure
```
/api/v1/
├── auth/           register, login, refresh, me
├── admin/          dashboard-stats, attendance-all, analytics
├── employees/      CRUD + import + generate-credentials
├── attendance/     clock-in, clock-out, my-status, my-history
├── shifts/         CRUD
└── departments/    CRUD
```

### Database Additions
- `departments` table (name, tenant_id, is_active)
- `UniqueConstraint('employee_id', 'date')` on attendance_records
- employee.department → FK to departments (nullable, for backward compat)

### Frontend Routes
```
/                    Landing page
/login               Login (redirects based on role)
/register            Register organization
/admin               Admin Dashboard (company-wide)
/admin/employees     Employee Management
/employee            Employee Dashboard (personal)
```

### Real-Time Strategy
- Admin dashboard polls `/api/v1/admin/dashboard-stats` every 15 seconds
- Employee dashboard polls `/api/v1/attendance/my-status` every 30 seconds

## Implementation Tasks

### Phase 1: Backend
- [ ] 1.1 Add `departments` model + CRUD API
- [ ] 1.2 Enhance employee API: create user+employee together, generate credentials
- [ ] 1.3 Add `/admin/dashboard-stats` endpoint (company-wide stats)
- [ ] 1.4 Add `/admin/attendance-all` endpoint (all employees, with filters)
- [ ] 1.5 Add `/admin/analytics` endpoint (trends, department breakdown)
- [ ] 1.6 Add UniqueConstraint on attendance_records(employee_id, date)
- [ ] 1.7 Add `/employees/import` endpoint (CSV/Excel upload)
- [ ] 1.8 Seed default departments

### Phase 2: Frontend Infrastructure
- [ ] 2.1 Sidebar component with role-based navigation
- [ ] 2.2 Admin layout wrapper
- [ ] 2.3 Employee layout wrapper
- [ ] 2.4 Auth context with role awareness
- [ ] 2.5 Redirect logic (role-based after login)

### Phase 3: Admin Dashboard
- [ ] 3.1 Stats cards (Total Employees, Present, Absent, Late, On Leave, Checked In, Working)
- [ ] 3.2 Real-time attendance table with search + filters
- [ ] 3.3 Date picker for historical view
- [ ] 3.4 Attendance trend chart (7-day/30-day)
- [ ] 3.5 Department-wise analytics chart

### Phase 4: Employee Dashboard
- [ ] 4.1 Personal clock in/out
- [ ] 4.2 Personal attendance history table
- [ ] 4.3 Working hours summary
- [ ] 4.4 Profile section

### Phase 5: Employee Management
- [ ] 5.1 Employee list with search/filter
- [ ] 5.2 Add employee form (creates user + employee)
- [ ] 5.3 Edit employee
- [ ] 5.4 Deactivate/delete employee
- [ ] 5.5 CSV/Excel import
