"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarOff,
  MonitorPlay,
  Search,
  ChevronDown,
} from "lucide-react";

interface DashboardStats {
  total_employees: number;
  present: number;
  absent: number;
  late: number;
  on_leave: number;
  half_day: number;
  currently_checked_in: number;
  currently_working: number;
}

interface AttendanceRecord {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  employee_email: string;
  department: string;
  designation: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  total_hours: number | null;
  overtime_hours: number | null;
  source: string;
}

const API = "";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  }), []);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (targetDate) params.set("target_date", targetDate);
      if (department) params.set("department", department);
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const [statsRes, attendanceRes] = await Promise.all([
        fetch(`${API}/api/v1/admin/dashboard-stats`, { headers: headers() }),
        fetch(`${API}/api/v1/admin/attendance-all?${params.toString()}`, { headers: headers() }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (attendanceRes.ok) {
        const data = await attendanceRes.json();
        setRecords(Array.isArray(data) ? data : data.records || []);
      }
    } catch {}
    setLoading(false);
  }, [targetDate, department, statusFilter, search, headers]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const badge = (status: string) => {
    const base = "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold";
    switch (status?.toLowerCase()) {
      case "present": return `${base} bg-emerald-50 text-emerald-700 border border-emerald-100`;
      case "late": return `${base} bg-amber-50 text-amber-700 border border-amber-100`;
      case "absent": return `${base} bg-red-50 text-red-600 border border-red-100`;
      case "on_leave": return `${base} bg-orange-50 text-orange-700 border border-orange-100`;
      case "half_day": return `${base} bg-purple-50 text-purple-700 border border-purple-100`;
      case "checked_in": return `${base} bg-primary/10 text-primary-dark border border-primary/20`;
      default: return `${base} bg-gray-50 text-gray-600 border border-gray-100`;
    }
  };

  const fmtTime = (t: string | null) => {
    if (!t) return "—";
    // Handle both full ISO datetime and time-only strings like "08:05:32.029725"
    try {
      if (t.includes("T")) {
        return new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      }
      // Time-only: parse HH:MM:SS
      const parts = t.split(":");
      if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parts[1];
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        return `${h12}:${m} ${ampm}`;
      }
      return t;
    } catch {
      return t;
    }
  };

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("");

  const statCards = [
    { label: "Total Employees", value: stats?.total_employees ?? 0, icon: Users, bg: "bg-primary/8", border: "border-primary/15", iconColor: "text-primary-dark" },
    { label: "Present", value: stats?.present ?? 0, icon: UserCheck, bg: "bg-emerald-50", border: "border-emerald-100", iconColor: "text-emerald-500" },
    { label: "Absent", value: stats?.absent ?? 0, icon: UserX, bg: "bg-red-50", border: "border-red-100", iconColor: "text-red-500" },
    { label: "Late", value: stats?.late ?? 0, icon: Clock, bg: "bg-amber-50", border: "border-amber-100", iconColor: "text-amber-500" },
    { label: "On Leave", value: stats?.on_leave ?? 0, icon: CalendarOff, bg: "bg-orange-50", border: "border-orange-100", iconColor: "text-orange-500" },
    { label: "Checked In", value: stats?.currently_checked_in ?? 0, icon: MonitorPlay, bg: "bg-sage/10", border: "border-sage/20", iconColor: "text-accent-dark" },
  ];

  const departments = [...new Set(records.map((r) => r.department).filter(Boolean))];
  const statuses = [...new Set(records.map((r) => r.status).filter(Boolean))];

  return (
    <div className="p-5 sm:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">Real-time attendance overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((s, i) => (
          <div
            key={i}
            className={`${s.bg} ${s.border} border rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fade-in-up`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] sm:text-xs font-semibold text-text-secondary">{s.label}</span>
              <s.icon size={16} className={s.iconColor} />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-text">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-4 sm:p-5 mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface/50 text-text placeholder-text-muted/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          <div className="relative">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="appearance-none w-full sm:w-44 px-4 py-2.5 pr-9 rounded-xl border border-border bg-surface/50 text-text text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none w-full sm:w-36 px-4 py-2.5 pr-9 rounded-xl border border-border bg-surface/50 text-text text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            >
              <option value="">All Status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>

          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-surface/50 text-text text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: "300ms" }}>
        <div className="px-5 sm:px-6 py-4 border-b border-black/[0.04] flex items-center justify-between">
          <h2 className="font-bold text-sm sm:text-base text-text tracking-tight">Attendance Records</h2>
          <span className="text-xs font-semibold text-text-muted bg-surface px-2.5 py-1 rounded-full">{records.length} records</span>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface/60">
                {["Employee", "Department", "Clock In", "Clock Out", "Hours", "Status"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-text-muted font-medium">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-text-muted font-medium">No records found</td></tr>
              ) : records.map((r, i) => (
                <tr key={i} className="hover:bg-surface/40 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary-dark font-bold text-xs">{initials(r.employee_name)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text">{r.employee_name}</p>
                        <p className="text-[11px] text-text-muted font-medium">{r.employee_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary font-medium">{r.department || "—"}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary font-medium">{fmtTime(r.clock_in)}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary font-medium">{fmtTime(r.clock_out)}</td>
                  <td className="px-6 py-3.5 text-sm text-text font-semibold">{r.total_hours ? `${r.total_hours.toFixed(1)}h` : "—"}</td>
                  <td className="px-6 py-3.5"><span className={badge(r.status)}>{r.status?.replace("_", " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-black/[0.04]">
          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-text-muted font-medium">Loading...</div>
          ) : records.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-text-muted font-medium">No records found</div>
          ) : records.map((r, i) => (
            <div key={i} className="px-5 py-4 hover:bg-surface/40 transition-colors">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary-dark font-bold text-xs">{initials(r.employee_name)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{r.employee_name}</p>
                    <p className="text-[11px] text-text-muted font-medium">{r.department}</p>
                  </div>
                </div>
                <span className={`${badge(r.status)} shrink-0 ml-2`}>{r.status?.replace("_", " ")}</span>
              </div>
              <div className="flex items-center gap-5 text-xs text-text-secondary ml-10 font-medium">
                <span>In: <span className="text-text font-semibold">{fmtTime(r.clock_in)}</span></span>
                <span>Out: <span className="text-text font-semibold">{fmtTime(r.clock_out)}</span></span>
                <span>Hrs: <span className="text-text font-semibold">{r.total_hours ? `${r.total_hours.toFixed(1)}h` : "—"}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
