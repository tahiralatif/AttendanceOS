"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AttendanceToday {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  total_hours: number | null;
  is_clocked_in: boolean;
}

interface AttendanceSummary {
  date: string;
  total_employees: number;
  present: number;
  absent: number;
  late: number;
  on_leave: number;
  half_day: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [todayRecords, setTodayRecords] = useState<AttendanceToday[]>([]);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState("");

  const API = "";

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchUserData();
    fetchSummary();
    fetchTodayAttendance();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  });

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API}/api/v1/auth/me`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setUserName(data.full_name);
      }
    } catch {}
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API}/api/v1/attendance/summary`, { headers: headers() });
      if (res.ok) setSummary(await res.json());
    } catch {}
  };

  const fetchTodayAttendance = async () => {
    try {
      const res = await fetch(`${API}/api/v1/attendance/today`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setTodayRecords(data);
        const me = data.find((r: AttendanceToday) => r.is_clocked_in);
        if (me) setClockedIn(true);
      }
    } catch {}
  };

  const handleClock = async () => {
    setClockLoading(true);
    try {
      const endpoint = clockedIn ? "clock-out" : "clock-in";
      const body: Record<string, unknown> = {};

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          body.latitude = pos.coords.latitude;
          body.longitude = pos.coords.longitude;
        } catch {}
      }

      const res = await fetch(`${API}/api/v1/attendance/${endpoint}`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setClockedIn(!clockedIn);
        fetchTodayAttendance();
        fetchSummary();
      }
    } catch {}
    setClockLoading(false);
  };

  const greeting =
    currentTime.getHours() < 12 ? "morning" : currentTime.getHours() < 17 ? "afternoon" : "evening";

  const stats = summary
    ? [
        { label: "Present", value: summary.present, icon: "✓" },
        { label: "Absent", value: summary.absent, icon: "✕" },
        { label: "Late", value: summary.late, icon: "⏰" },
        { label: "On Leave", value: summary.on_leave, icon: "🏖" },
      ]
    : [];

  const statusBadge = (status: string) => {
    const base = "inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case "present": return `${base} bg-accent/20 text-accent-dark`;
      case "late": return `${base} bg-warning/20 text-yellow-700`;
      case "absent": return `${base} bg-danger/10 text-danger`;
      default: return `${base} bg-primary/20 text-secondary`;
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-sm sm:text-base text-text">Dashboard</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-xs sm:text-sm text-text-secondary hidden sm:inline">
              {userName || "Loading..."}
            </span>
            <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center shrink-0">
              <span className="text-secondary font-medium text-sm">
                {userName ? userName.charAt(0).toUpperCase() : "?"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ── Welcome + Clock ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-text mb-1">
              Good {greeting}, {userName || "there"}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-4 sm:p-6 text-center sm:w-auto w-full">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-text mb-3">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </div>
            <button
              onClick={handleClock}
              disabled={clockLoading}
              className={`w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-medium text-sm transition-all hover:shadow-lg disabled:opacity-50 ${
                clockedIn
                  ? "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20"
                  : "bg-primary text-white hover:bg-primary-dark hover:shadow-primary/25"
              }`}
            >
              {clockLoading ? "Processing..." : clockedIn ? "Clock Out" : "Clock In"}
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-4 sm:p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm text-text-secondary">{stat.label}</span>
                <span className="text-base sm:text-lg">{stat.icon}</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-text">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* ── Today's Attendance ── */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border">
            <h2 className="font-semibold text-sm sm:text-base text-text">Today&apos;s Attendance</h2>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-cream-light">
                  {["Employee", "Clock In", "Clock Out", "Hours", "Status"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {todayRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-text-muted text-sm">
                      No attendance records yet today
                    </td>
                  </tr>
                ) : (
                  todayRecords.map((record) => (
                    <tr key={record.employee_id} className="hover:bg-cream-light/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center shrink-0">
                            <span className="text-secondary font-medium text-xs">
                              {record.employee_name.split(" ").map((n) => n[0]).join("")}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text">{record.employee_name}</p>
                            <p className="text-xs text-text-muted">{record.employee_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text">{record.clock_in || "—"}</td>
                      <td className="px-6 py-4 text-sm text-text">{record.clock_out || "—"}</td>
                      <td className="px-6 py-4 text-sm text-text">{record.total_hours ? `${record.total_hours}h` : "—"}</td>
                      <td className="px-6 py-4">
                        <span className={statusBadge(record.status)}>{record.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {todayRecords.length === 0 ? (
              <div className="px-4 py-10 text-center text-text-muted text-sm">
                No attendance records yet today
              </div>
            ) : (
              todayRecords.map((record) => (
                <div key={record.employee_id} className="px-4 py-3.5 hover:bg-cream-light/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center shrink-0">
                        <span className="text-secondary font-medium text-xs">
                          {record.employee_name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate">{record.employee_name}</p>
                        <p className="text-xs text-text-muted">{record.employee_code}</p>
                      </div>
                    </div>
                    <span className={`${statusBadge(record.status)} shrink-0 ml-2`}>{record.status}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-secondary ml-10">
                    <span>In: <span className="text-text font-medium">{record.clock_in || "—"}</span></span>
                    <span>Out: <span className="text-text font-medium">{record.clock_out || "—"}</span></span>
                    <span>Hrs: <span className="text-text font-medium">{record.total_hours ? `${record.total_hours}h` : "—"}</span></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
