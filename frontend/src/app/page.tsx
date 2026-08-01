"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu, X, FileSpreadsheet, RefreshCw, BarChart3,
  Building2, Clock, ShieldCheck, ArrowRight, CheckCircle2,
  Star,
} from "lucide-react";

const features = [
  { icon: FileSpreadsheet, title: "OCR Import", desc: "Upload Excel, CSV, PDF, or scanned images — AI extracts attendance data automatically" },
  { icon: RefreshCw, title: "Live Sync", desc: "Connect Google Sheets or Excel files. Data stays in sync automatically" },
  { icon: BarChart3, title: "Smart Reports", desc: "Real-time dashboards, absenteeism analytics, overtime tracking" },
  { icon: Building2, title: "Multi-Tenant", desc: "One platform, unlimited organizations. Data isolation built-in" },
  { icon: Clock, title: "Clock In / Out", desc: "Web, mobile, GPS — clock in from anywhere with offline support" },
  { icon: ShieldCheck, title: "Anomaly Detection", desc: "AI flags buddy punching, ghost employees, and attendance fraud" },
];

const stats = [
  { label: "Present", value: "48", bg: "bg-emerald-50", text: "text-emerald-700" },
  { label: "Absent", value: "12", bg: "bg-red-50", text: "text-red-600" },
  { label: "Late", value: "6", bg: "bg-amber-50", text: "text-amber-700" },
  { label: "Leave", value: "3", bg: "bg-orange-50", text: "text-orange-700" },
];

const employees = [
  { name: "Sarah Johnson", initials: "SJ", time: "9:00 AM", out: "5:30 PM", status: "present" },
  { name: "Mike Chen", initials: "MC", time: "9:15 AM", out: "—", status: "active" },
  { name: "Emily Davis", initials: "ED", time: "9:45 AM", out: "6:00 PM", status: "late" },
];

const barData = [35, 50, 30, 65, 55, 80, 42, 72, 60, 88, 48, 78];
const barLabels = ["M", "T", "W", "T", "F", "S", "S", "M", "T", "W", "T", "Today"];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      {/* ════ NAV ════ */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm shadow-primary/20">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-[15px] tracking-tight text-text">AttendanceOS</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text transition-colors">Sign In</Link>
            <Link href="/register" className="text-sm font-semibold bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-200">
              Get Started Free
            </Link>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden p-2 -mr-2 rounded-lg hover:bg-black/5 transition-colors">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <div className="sm:hidden border-t border-black/[0.04] bg-surface/95 backdrop-blur-xl px-5 py-4 space-y-3">
            <Link href="/login" className="block py-2 text-sm font-medium text-text-secondary" onClick={() => setMenuOpen(false)}>Sign In</Link>
            <Link href="/register" className="block text-center py-3 text-sm font-semibold bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl" onClick={() => setMenuOpen(false)}>Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* ════ HERO ════ */}
      <section className="relative pt-28 pb-20 sm:pt-32 sm:pb-24 lg:pt-36 lg:pb-28 overflow-hidden">
        {/* Subtle background blobs */}
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/[0.05] rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* ── Left: Copy ── */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-cream/70 border border-cream px-4 py-1.5 rounded-full mb-6 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-semibold text-secondary tracking-wide uppercase">Enterprise Attendance Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-text leading-[1.08] tracking-tight mb-5 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                Attendance management{" "}
                <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  that actually works
                </span>
              </h1>

              <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                OCR-powered imports, real-time tracking, smart analytics.
                Replace spreadsheets with a platform your HR team will love.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                <Link href="/register" className="w-full sm:w-auto group flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-7 py-3.5 rounded-xl font-semibold text-sm hover:shadow-xl hover:shadow-primary/25 transition-all duration-200">
                  Start Free Trial
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="#features" className="w-full sm:w-auto text-center px-7 py-3.5 rounded-xl font-semibold text-sm text-text-secondary border border-border hover:border-primary/40 hover:text-primary transition-all duration-200">
                  See Features
                </Link>
              </div>
            </div>

            {/* ── Right: Dashboard Preview ── */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <div className="relative">
                {/* Glow behind card */}
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/15 via-accent/10 to-cream/30 rounded-3xl blur-2xl opacity-60" />

                <div className="relative bg-white rounded-2xl border border-black/[0.06] shadow-2xl shadow-black/[0.06] p-5 sm:p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Today&apos;s Overview</p>
                      <p className="text-sm font-bold text-text mt-0.5">July 31, 2026</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-emerald-700">Live</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2.5 mb-5">
                    {stats.map((s, i) => (
                      <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
                        <p className={`text-xl font-extrabold ${s.text}`}>{s.value}</p>
                        <p className="text-[10px] font-semibold text-text-muted mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="border border-black/[0.05] rounded-xl overflow-hidden mb-5">
                    <div className="grid grid-cols-[1fr_70px_70px] px-3.5 py-2 bg-surface text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      <span>Employee</span>
                      <span className="text-right">In</span>
                      <span className="text-right">Out</span>
                    </div>
                    {employees.map((e, i) => {
                      const colors = {
                        present: "bg-primary/15 text-primary-dark",
                        active: "bg-accent/15 text-accent-dark",
                        late: "bg-amber-100 text-amber-700",
                      };
                      return (
                        <div key={i} className="grid grid-cols-[1fr_70px_70px] items-center px-3.5 py-2.5 border-t border-black/[0.04]">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-full ${colors[e.status as keyof typeof colors]} flex items-center justify-center shrink-0`}>
                              <span className="text-[9px] font-bold">{e.initials}</span>
                            </div>
                            <span className="text-xs font-medium text-text truncate">{e.name}</span>
                          </div>
                          <span className="text-[11px] text-text-secondary font-medium text-right">{e.time}</span>
                          <span className="text-[11px] text-text-muted font-medium text-right">{e.out}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chart */}
                  <div className="flex items-end gap-[3px] h-14">
                    {barData.map((h, i) => (
                      <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary/50 to-primary/25 transition-all" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5 px-0.5">
                    {barLabels.map((l, i) => (
                      <span key={i} className="text-[8px] font-semibold text-text-muted flex-1 text-center">{l}</span>
                    ))}
                  </div>
                </div>

                {/* Floating: 92% badge */}
                <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-white rounded-xl shadow-lg shadow-black/[0.08] border border-black/[0.06] px-3 py-2 flex items-center gap-2 z-10">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Star size={14} className="text-emerald-600 fill-emerald-200" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-text">92%</p>
                    <p className="text-[9px] font-semibold text-text-muted">Attendance</p>
                  </div>
                </div>

                {/* Floating: OCR badge */}
                <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-white rounded-xl shadow-lg shadow-black/[0.08] border border-black/[0.06] px-3 py-2 flex items-center gap-2 z-10">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileSpreadsheet size={14} className="text-primary-dark" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-text">OCR</p>
                    <p className="text-[9px] font-semibold text-text-muted">Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ FEATURES ════ */}
      <section id="features" className="py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-transparent via-cream-light/50 to-transparent">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text tracking-tight mb-3 animate-fade-in-up">
              Everything you need
            </h2>
            <p className="text-sm sm:text-base text-text-secondary animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              Built for teams that take attendance seriously
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group bg-white p-6 rounded-2xl border border-black/[0.05] hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/[0.06] hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-cream/60 flex items-center justify-center mb-4 group-hover:from-primary/20 group-hover:to-primary/5 transition-colors">
                  <f.icon size={20} className="text-primary-dark" />
                </div>
                <h3 className="font-bold text-text text-[15px] mb-1.5">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CTA ════ */}
      <section className="py-20 sm:py-24 lg:py-28">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text tracking-tight mb-4 animate-fade-in-up">
            Ready to modernize attendance?
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mb-8 sm:mb-10 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            Free for up to 10 employees. No credit card required.
          </p>
          <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <Link href="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-4 rounded-xl font-semibold text-sm sm:text-base hover:shadow-xl hover:shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5">
              Get Started — It&apos;s Free
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="py-6 sm:py-8 border-t border-black/[0.05]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">A</span>
            </div>
            <span className="text-sm text-text-secondary font-medium">AttendanceOS</span>
          </div>
          <p className="text-xs text-text-muted">© 2026 AttendanceOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
