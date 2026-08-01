"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [clockStatus, setClockStatus] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/login"); return; }
    fetch("/api/v1/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setUserName(d.full_name || "");
        if (["org_admin", "hr_admin", "manager"].includes(d.role)) {
          router.push("/admin");
        }
      })
      .catch(() => {});

    fetch("/api/v1/attendance/my-status", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setClockStatus(d.is_clocked_in))
      .catch(() => {});
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/employee" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm shadow-primary/20">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-sm sm:text-[15px] text-text tracking-tight">AttendanceOS</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Clock status indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold ${
              clockStatus
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-gray-50 text-gray-500 border border-gray-100"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${clockStatus ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
              {clockStatus ? "Checked In" : "Not Clocked In"}
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary-dark font-bold text-xs">{userName ? userName.charAt(0).toUpperCase() : "?"}</span>
              </div>
              <span className="text-xs sm:text-sm text-text-secondary hidden sm:inline font-medium">{userName || "Loading..."}</span>
            </div>

            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
