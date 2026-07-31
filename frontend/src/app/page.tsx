"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    { icon: "📄", title: "OCR Import", desc: "Upload Excel, CSV, PDF, or scanned images — AI extracts attendance data automatically" },
    { icon: "🔄", title: "Live Sync", desc: "Connect Google Sheets or Excel files. Data stays in sync automatically" },
    { icon: "📊", title: "Smart Reports", desc: "Real-time dashboards, absenteeism analytics, overtime tracking" },
    { icon: "🏢", title: "Multi-Tenant", desc: "One platform, unlimited organizations. Data isolation built-in" },
    { icon: "⏰", title: "Clock In/Out", desc: "Web, mobile, GPS — clock in from anywhere with offline support" },
    { icon: "🔍", title: "Anomaly Detection", desc: "AI flags buddy punching, ghost employees, and attendance fraud" },
  ];

  return (
    <div className="min-h-screen bg-white font-['Inter',system-ui,-apple-system,sans-serif]">
      {/* ══════════════════════════════════════════════════════════
          NAVIGATION
      ══════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-lg text-gray-900 tracking-tight">AttendanceOS</span>
          </Link>

          {/* Desktop */}
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
          >
            <span className={`block w-5 h-0.5 bg-gray-700 rounded transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-[4px]" : ""}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 rounded transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 rounded transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-[4px]" : ""}`} />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-5 py-4 space-y-3">
            <Link href="/login" className="block text-sm font-medium text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
            <Link href="/register" className="block text-sm font-semibold bg-primary text-white px-5 py-3 rounded-lg text-center" onClick={() => setMenuOpen(false)}>
              Get Started Free
            </Link>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════════════════
          HERO — Two-column: Text left, Dashboard card right
      ══════════════════════════════════════════════════════════ */}
      <section className="pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* ── Left: Copy ── */}
            <div className="flex-1 text-center lg:text-left max-w-xl lg:max-w-none">
              <div className="inline-flex items-center gap-2 bg-cream/60 border border-cream px-3.5 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-xs font-semibold text-secondary tracking-wide uppercase">Enterprise Attendance Platform</span>
              </div>

              <h1 className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] font-bold text-gray-900 leading-[1.1] tracking-tight mb-5">
                Attendance management{" "}
                <span className="text-primary">that actually works</span>
              </h1>

              <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                OCR-powered imports, real-time tracking, smart analytics.
                Replace spreadsheets with a platform your HR team will love.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3">
                <Link
                  href="/register"
                  className="w-full sm:w-auto bg-primary text-white px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-primary/20 text-center"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="#features"
                  className="w-full sm:w-auto bg-white text-gray-700 px-7 py-3.5 rounded-xl font-semibold text-sm border border-gray-200 hover:border-primary/40 hover:text-primary transition-all duration-200 text-center"
                >
                  See Features
                </Link>
              </div>
            </div>

            {/* ── Right: Dashboard Preview Card ── */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none">
              <div className="relative">
                {/* Background decoration */}
                <div className="absolute -inset-3 bg-gradient-to-br from-primary/10 via-accent/10 to-cream/40 rounded-3xl blur-xl" />

                {/* Main card */}
                <div className="relative bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-5 sm:p-6">
                  {/* Card header */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Today&apos;s Overview</p>
                      <p className="text-sm font-semibold text-gray-700 mt-0.5">July 31, 2026</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-accent/10 px-3 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      <span className="text-xs font-semibold text-accent-dark">Live</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {[
                      { label: "Present", value: "48", color: "text-accent-dark", bg: "bg-accent/10" },
                      { label: "Absent", value: "12", color: "text-danger", bg: "bg-red-50" },
                      { label: "Late", value: "6", color: "text-yellow-600", bg: "bg-amber-50" },
                      { label: "Leave", value: "3", color: "text-primary-dark", bg: "bg-primary/10" },
                    ].map((s, i) => (
                      <div key={i} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                        <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] font-medium text-gray-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mini attendance table */}
                  <div className="border border-gray-100 rounded-xl overflow-hidden mb-5">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-3.5 py-2 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      <span>Employee</span>
                      <span>In</span>
                      <span>Out</span>
                    </div>
                    {[
                      { name: "Sarah Johnson", initials: "SJ", time: "9:00 AM", out: "5:30 PM", color: "bg-primary/15 text-primary-dark" },
                      { name: "Mike Chen", initials: "MC", time: "9:15 AM", out: "—", color: "bg-accent/15 text-accent-dark" },
                      { name: "Emily Davis", initials: "ED", time: "9:45 AM", out: "6:00 PM", color: "bg-amber-100 text-yellow-700" },
                    ].map((emp, i) => (
                      <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-3.5 py-2.5 border-t border-gray-50">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-6 h-6 rounded-full ${emp.color} flex items-center justify-center shrink-0`}>
                            <span className="text-[9px] font-bold">{emp.initials}</span>
                          </div>
                          <span className="text-xs font-medium text-gray-700 truncate">{emp.name}</span>
                        </div>
                        <span className="text-[11px] text-gray-600 font-medium">{emp.time}</span>
                        <span className="text-[11px] text-gray-400 font-medium">{emp.out}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mini chart placeholder */}
                  <div className="flex items-end gap-1 h-16 px-2">
                    {[40, 55, 35, 70, 60, 85, 45, 75, 65, 90, 50, 80].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/60 to-primary/30" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between px-2 mt-1.5">
                    <span className="text-[9px] text-gray-400 font-medium">Mon</span>
                    <span className="text-[9px] text-gray-400 font-medium">Fri</span>
                    <span className="text-[9px] text-gray-400 font-medium">Today</span>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">92%</p>
                    <p className="text-[9px] text-gray-400 font-medium">Attendance</p>
                  </div>
                </div>

                <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">OCR</p>
                    <p className="text-[9px] text-gray-400 font-medium">Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURES — 3-column grid
      ══════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20 sm:py-24 lg:py-28 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-3">
              Everything you need
            </h2>
            <p className="text-sm sm:text-base text-gray-500">
              Built for teams that take attendance seriously
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="w-11 h-11 rounded-xl bg-cream/60 flex items-center justify-center text-xl mb-4 group-hover:bg-primary/10 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-base mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 lg:py-28">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            Ready to modernize attendance?
          </h2>
          <p className="text-sm sm:text-base text-gray-500 mb-8 sm:mb-10">
            Free for up to 10 employees. No credit card required.
          </p>
          <Link
            href="/register"
            className="inline-block bg-primary text-white px-8 py-4 rounded-xl font-semibold text-sm sm:text-base hover:bg-primary-dark transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
          >
            Get Started — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="py-6 sm:py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">A</span>
            </div>
            <span className="text-sm text-gray-500 font-medium">AttendanceOS</span>
          </div>
          <p className="text-xs text-gray-400">
            © 2026 AttendanceOS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
