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
    <div className="min-h-screen bg-surface">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-base sm:text-lg text-text">AttendanceOS</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/20">
              Get Started Free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5" aria-label="Toggle menu">
            <span className={`block w-5 h-0.5 bg-text rounded transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-1" : ""}`} />
            <span className={`block w-5 h-0.5 bg-text rounded transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-text rounded transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-1" : ""}`} />
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="sm:hidden border-t border-border bg-surface/95 backdrop-blur-lg px-4 py-4 space-y-3 animate-fade-in">
            <Link href="/login" className="block text-sm font-medium text-text-secondary hover:text-text py-2" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
            <Link href="/register" className="block text-sm font-medium bg-primary text-white px-4 py-2.5 rounded-lg text-center hover:bg-primary-dark" onClick={() => setMenuOpen(false)}>
              Get Started Free
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-cream px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full mb-5 sm:mb-6">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-secondary">Enterprise Attendance Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text leading-tight mb-5 sm:mb-6">
            Attendance management<br className="hidden sm:block" />{" "}
            <span className="text-primary">that actually works</span>
          </h1>

          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            OCR-powered imports, real-time tracking, smart analytics. Replace spreadsheets with a platform your HR team will love.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/register" className="w-full sm:w-auto bg-primary text-white px-8 py-3.5 rounded-xl font-medium text-sm hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 text-center">
              Start Free Trial
            </Link>
            <Link href="#features" className="w-full sm:w-auto bg-white text-text px-8 py-3.5 rounded-xl font-medium text-sm border border-border hover:border-primary/30 transition-all hover:shadow-md text-center">
              See Features
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-cream-light">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text mb-3 sm:mb-4">Everything you need</h2>
            <p className="text-sm sm:text-base text-text-secondary">Built for teams that take attendance seriously</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-text mb-1.5 sm:mb-2 text-sm sm:text-base">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text mb-3 sm:mb-4">
            Ready to modernize attendance?
          </h2>
          <p className="text-sm sm:text-base text-text-secondary mb-8 sm:mb-10">
            Free for up to 10 employees. No credit card required.
          </p>
          <Link href="/register" className="inline-block bg-primary text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl font-medium text-sm sm:text-base hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5">
            Get Started — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="text-sm text-text-secondary">AttendanceOS</span>
          </div>
          <p className="text-xs sm:text-sm text-text-muted text-center sm:text-right">
            © 2026 AttendanceOS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
