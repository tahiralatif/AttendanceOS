"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LogIn,
  LogOut,
  Clock,
  Calendar,
  TrendingUp,
  UserCheck,
  UserX,
  AlertCircle,
} from "lucide-react";

interface MyStatus {
  employee_id: string;
  employee_name: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  total_hours: number | null;
  is_clocked_in: boolean;
}

interface HistoryRecord {
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  total_hours: number | null;
}

interface HistorySummary {
  total_days: number;
  present_days: number;
  late_days: number;
  leave_days: number;
  total_hours: number;
  avg_hours: number;
}

const API = "";

export default function EmployeeDashboardPage() {
  const [userName, setUserName] = useState("");
  const [status, setStatus] = useState<MyStatus | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockError, setClockError] = useState("");

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  }), []);

  const fetchStatus = useCallback(async () => {
    try {
      const [meRes, statusRes] = await Promise.all([
        fetch(`${API}/api/v1/auth/me`, { headers: headers() }),
        fetch(`${API}/api/v1/attendance/my-status`, { headers: headers() }),
      ]);
      if (meRes.ok) {
        const me = await meRes.json();
        setUserName(me.full_name || "");
      }
      if (statusRes.ok) setStatus(await statusRes.json());
    } catch {}
  }, [headers]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/attendance/my-history?days=30`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.records || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch {}
  }, [headers]);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [fetchStatus, fetchHistory]);

  useEffect(() => {
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleClock = async () => {
    setClockLoading(true);
    setClockError("");
    try {
      const body: Record<string, unknown> = {};
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
          );
          body.latitude = pos.coords.latitude;
          body.longitude = pos.coords.longitude;
        } catch {}
      }
      const ep = status?.is_clocked_in ? "clock-out" : "clock-in";
      const res = await fetch(`${API}/api/v1/attendance/${ep}`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        setClockError(data.detail || "Action failed");
        return;
      }
      fetchStatus();
      fetchHistory();
    } catch {
      setClockError("Network error. Please try again.");
    }
    setClockLoading(false);
  };

  const greeting = now ? (now.getHours() < 12 ? "Good Morning" : now.getHours() < 17 ? "Good Afternoon" : "Good Evening") : "Hello";

  const badge = (s: string) => {
    const base = "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold";
    switch (s?.toLowerCase()) {
      case "present": return `${base} bg-emerald-50 text-emerald-700 border border-emerald-100`;
      case "late": return `${base} bg-amber-50 text-amber-700 border border-amber-100`;
      case "absent": return `${base} bg-red-50 text-red-600 border border-red-100`;
      case "on_leave": return `${base} bg-orange-50 text-orange-700 border border-orange-100`;
      default: return `${base} bg-gray-50 text-gray-600 border border-gray-100`;
    }
  };

  const summaryCards = summary ? [
    { label: "Total Days", value: summary.total_days, icon: Calendar, bg: "bg-primary/8", border: "border-primary/15", iconColor: "text-primary-dark" },
    { label: "Present", value: summary.present_days, icon: UserCheck, bg: "bg-emerald-50", border: "border-emerald-100", iconColor: "text-emerald-500" },
    { label: "Late", value: summary.late_days, icon: AlertCircle, bg: "bg-amber-50", border: "border-amber-100", iconColor: "text-amber-500" },
    { label: "Leave", value: summary.leave_days, icon: UserX, bg: "bg-red-50", border: "border-red-100", iconColor: "text-red-500" },
    { label: "Avg Hours", value: summary.avg_hours?.toFixed(1), icon: TrendingUp, bg: "bg-accent/10", border: "border-accent/20", iconColor: "text-accent-dark" },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 sm:py-8">
      {/* Welcome */}
      <div className="mb-6 sm:mb-8 animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">{greeting}, {userName || "there"} 👋</h1>
        <p className="text-sm text-text-secondary mt-1 font-medium">
          {now ? now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Loading..."}
        </p>
      </div>

      {/* Clock Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 sm:p-6 text-center sm:w-auto w-full">
          <div className="text-4xl sm:text-5xl font-mono font-extrabold text-text tracking-tight mb-4">
            {now ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "--:--:-- --"}
          </div>
          <button
            onClick={handleClock}
            disabled={clockLoading}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 ${
              status?.is_clocked_in
                ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                : "bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg hover:shadow-primary/25"
            }`}
          >
            {clockLoading ? "Processing..." : status?.is_clocked_in ? <><LogOut size={16} /> Clock Out</> : <><LogIn size={16} /> Clock In</>}
          </button>
          {clockError && <p className="mt-2 text-xs text-red-500 font-medium animate-fade-in">{clockError}</p>}
        </div>

        {/* Today's Status Card */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 sm:p-6 flex-1">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Today&apos;s Status</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] font-semibold text-text-muted mb-0.5">Clock In</p>
              <p className="text-sm font-bold text-text">{status?.clock_in ? new Date(status.clock_in).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-text-muted mb-0.5">Clock Out</p>
              <p className="text-sm font-bold text-text">{status?.clock_out ? new Date(status.clock_out).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-text-muted mb-0.5">Total Hours</p>
              <p className="text-sm font-bold text-text">{status?.total_hours ? `${status.total_hours.toFixed(1)}h` : "—"}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-black/[0.04]">
            <span className={badge(status?.status || "")}>{status?.status || "No record"}</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {summaryCards.map((s, i) => (
            <div
              key={i}
              className={`${s.bg} ${s.border} border rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fade-in-up`}
              style={{ animationDelay: `${(i + 2) * 60}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] sm:text-xs font-semibold text-text-secondary">{s.label}</span>
                <s.icon size={15} className={s.iconColor} />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-text">{s.value ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance History */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <div className="px-5 sm:px-6 py-4 border-b border-black/[0.04] flex items-center justify-between">
          <h2 className="font-bold text-sm sm:text-base text-text tracking-tight">Attendance History (Last 30 Days)</h2>
          <span className="text-xs font-semibold text-text-muted bg-surface px-2.5 py-1 rounded-full">{history.length} days</span>
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface/60">
                {["Date", "Clock In", "Clock Out", "Hours", "Status"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {history.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-text-muted font-medium">No history yet</td></tr>
              ) : history.map((r, i) => (
                <tr key={i} className="hover:bg-surface/40 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-medium text-text">{r.date}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary font-medium">{r.clock_in ? new Date(r.clock_in).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary font-medium">{r.clock_out ? new Date(r.clock_out).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="px-6 py-3.5 text-sm text-text font-semibold">{r.total_hours ? `${r.total_hours.toFixed(1)}h` : "—"}</td>
                  <td className="px-6 py-3.5"><span className={badge(r.status)}>{r.status?.replace("_", " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-black/[0.04]">
          {history.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-text-muted font-medium">No history yet</div>
          ) : history.map((r, i) => (
            <div key={i} className="px-5 py-3.5 hover:bg-surface/40 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-text">{r.date}</span>
                <span className={badge(r.status)}>{r.status?.replace("_", " ")}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-secondary font-medium">
                <span>In: <span className="text-text font-semibold">{r.clock_in ? new Date(r.clock_in).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</span></span>
                <span>Out: <span className="text-text font-semibold">{r.clock_out ? new Date(r.clock_out).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}</span></span>
                <span>Hrs: <span className="text-text font-semibold">{r.total_hours ? `${r.total_hours.toFixed(1)}h` : "—"}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
