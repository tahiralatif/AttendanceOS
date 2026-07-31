"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-lg text-text">AttendanceOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/20">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-cream px-4 py-1.5 rounded-full mb-6">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium text-secondary">Enterprise Attendance Platform</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-text leading-tight mb-6">
            Attendance management<br /><span className="text-primary">that actually works</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            OCR-powered imports, real-time tracking, smart analytics. Replace spreadsheets with a platform your HR team will love.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="bg-primary text-white px-8 py-3.5 rounded-xl font-medium text-sm hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5">
              Start Free Trial
            </Link>
            <Link href="#features" className="bg-white text-text px-8 py-3.5 rounded-xl font-medium text-sm border border-border hover:border-primary/30 transition-all hover:shadow-md">
              See Features
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-cream-light">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl font-bold text-text mb-4">Everything you need</h2>
            <p className="text-text-secondary">Built for teams that take attendance seriously</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 stagger">
            {[{icon:"📄",title:"OCR Import",desc:"Upload Excel, CSV, PDF, or scanned images — AI extracts attendance data automatically"},{icon:"🔄",title:"Live Sync",desc:"Connect Google Sheets or Excel files. Data stays in sync automatically"},{icon:"📊",title:"Smart Reports",desc:"Real-time dashboards, absenteeism analytics, overtime tracking"},{icon:"🏢",title:"Multi-Tenant",desc:"One platform, unlimited organizations. Data isolation built-in"},{icon:"⏰",title:"Clock In/Out",desc:"Web, mobile, GPS — clock in from anywhere with offline support"},{icon:"🔍",title:"Anomaly Detection",desc:"AI flags buddy punching, ghost employees, and attendance fraud"}].map((f,i)=>(
              <div key={i} className="bg-white p-6 rounded-2xl border border-border hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 animate-slide-up">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-text mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h2 className="text-3xl font-bold text-text mb-4">Ready to modernize attendance?</h2>
          <p className="text-text-secondary mb-8">Free for up to 10 employees. No credit card required.</p>
          <Link href="/register" className="inline-block bg-primary text-white px-10 py-4 rounded-xl font-medium hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5">
            Get Started — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="text-sm text-text-secondary">AttendanceOS</span>
          </div>
          <p className="text-sm text-text-muted">© 2026 AttendanceOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}