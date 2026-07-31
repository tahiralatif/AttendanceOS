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

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/login"); return; }
    fetchUserData();
    fetchSummary();
    fetchTodayAttendance();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  });

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API}/api/v1/auth/me`, { headers: headers() });
      if (res.ok) { const data = await res.json(); setUserName(data.full_name); }
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
        method: "POST", headers: headers(), body: JSON.stringify(body),
      });
      if (res.ok) { setClockedIn(!clockedIn); fetchTodayAttendance(); fetchSummary(); }
    } catch {}
    setClockLoading(false);
  };

  const stats = summary ? [
    { label: "Present", value: summary.present, color: "bg-accent", icon: "✓" },
    { label: "Absent", value: summary.absent, color: "bg-danger", icon: "✕" },
    { label: "Late", value: summary.late, color: "bg-warning", icon: "⏰" },
    { label: "On Leave", value: summary.on_leave, color: "bg-primary", icon: "🏖" },
  ] : [];

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white/80 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><span className="text-white font-bold text-sm">A</span></div>
            <span className="font-semibold text-text">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">{userName || "Loading..."}</span>
            <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center"><span className="text-secondary font-medium text-sm">{userName ? userName.charAt(0).toUpperCase() : "?"}</span></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-text mb-1">Good {currentTime.getHours() < 12 ? "morning" : currentTime.getHours() < 17 ? "afternoon" : "evening"}, {userName || "there"}</h1>
            <p className="text-text-secondary text-sm">{currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-6 text-center animate-scale-in">
            <div className="text-3xl font-mono font-bold text-text mb-3">{currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}</div>
            <button onClick={handleClock} disabled={clockLoading} className={`px-8 py-3 rounded-xl font-medium text-sm transition-all hover:shadow-lg disabled:opacity-50 ${clockedIn ? "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20" : "bg-primary text-white hover:bg-primary-dark hover:shadow-primary/25"}`}>
              {clockLoading ? "Processing..." : clockedIn ? "Clock Out" : "Clock In"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-all hover:-translate-y-0.5 animate-slide-up">
              <div className="flex items-center justify-between mb-3"><span className="text-sm text-text-secondary">{stat.label}</span><span className="text-lg">{stat.icon}</span></div>
              <div className="text-2xl font-bold text-text">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-border overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b border-border"><h2 className="font-semibold text-text">Today&apos;s Attendance</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-cream-light">
                  {["Employee","Clock In","Clock Out","Hours","Status"].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {todayRecords.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-text-muted text-sm">No attendance records yet today</td></tr>
                ) : todayRecords.map(r => (
                  <tr key={r.employee_id} className="hover:bg-cream-light/50 transition-colors">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center"><span className="text-secondary font-medium text-xs">{r.employee_name.split(" ").map(n=>n[0]).join("")}</span></div><div><p className="text-sm font-medium text-text">{r.employee_name}</p><p className="text-xs text-text-muted">{r.employee_code}</p></div></div></td>
                    <td className="px-6 py-4 text-sm text-text">{r.clock_in || "—"}</td>
                    <td className="px-6 py-4 text-sm text-text">{r.clock_out || "—"}</td>
                    <td className="px-6 py-4 text-sm text-text">{r.total_hours ? `${r.total_hours}h` : "—"}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.status === "present" ? "bg-accent/20 text-accent-dark" : r.status === "late" ? "bg-warning/20 text-yellow-700" : r.status === "absent" ? "bg-danger/10 text-danger" : "bg-primary/20 text-secondary"}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}