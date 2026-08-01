"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Employees", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/login"); return; }
    fetch("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setUserName(d.full_name || "Admin");
        setUserRole(d.role || "admin");
        if (!["org_admin", "hr_admin", "manager"].includes(d.role)) {
          router.push("/employee");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col bg-white border-r border-black/[0.06]">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-black/[0.04]">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm shadow-primary/20">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <span className="font-bold text-[15px] text-text tracking-tight block leading-tight">AttendanceOS</span>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-primary/10 text-primary-dark"
                    : "text-text-secondary hover:bg-surface hover:text-text"
                }`}
              >
                <item.icon size={18} className={active ? "text-primary-dark" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-black/[0.04]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary-dark font-bold text-sm">
                {userName ? userName.charAt(0).toUpperCase() : "A"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text truncate">{userName || "Loading..."}</p>
              <p className="text-[11px] font-medium text-text-muted capitalize">{userRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-red-50 hover:text-red-600 transition-all duration-150"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <header className="lg:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-surface transition-colors">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">A</span>
              </div>
              <span className="font-bold text-sm text-text tracking-tight">Admin</span>
            </div>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors">
            <LogOut size={18} />
          </button>
        </div>

        {mobileOpen && (
          <nav className="border-t border-black/[0.04] bg-white/95 backdrop-blur-xl px-4 py-3 space-y-1 animate-fade-in">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active ? "bg-primary/10 text-primary-dark" : "text-text-secondary hover:bg-surface"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                  {active && <ChevronRight size={14} className="ml-auto" />}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
