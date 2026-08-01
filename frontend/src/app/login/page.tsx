"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Login failed");
        return;
      }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      // Fetch user role to determine redirect
      try {
        const meRes = await fetch("/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          if (["org_admin", "hr_admin", "manager"].includes(me.role)) {
            router.push("/admin");
          } else {
            router.push("/employee");
          }
        } else {
          router.push("/admin");
        }
      } catch {
        router.push("/admin");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col lg:flex-row">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-secondary via-secondary-dark to-secondary-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-24 left-16 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-12 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-14 xl:px-20">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-white/90 font-bold text-xl tracking-tight">AttendanceOS</span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-5 tracking-tight">
            Welcome back to<br />smarter attendance
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            Track, manage, and report employee attendance with OCR-powered imports and real-time analytics.
          </p>
          <div className="mt-12 flex items-center gap-6">
            {[{ n: "10K+", l: "Employees" }, { n: "500+", l: "Organizations" }, { n: "99.9%", l: "Uptime" }].map((s, i) => (
              <div key={i}>
                <p className="text-2xl font-extrabold text-white">{s.n}</p>
                <p className="text-xs text-white/50 font-medium mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-12 min-h-screen lg:min-h-0">
        <div className="w-full max-w-[400px] animate-fade-in">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm shadow-primary/20">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg text-text tracking-tight">AttendanceOS</span>
          </div>

          <h2 className="text-2xl font-extrabold text-text tracking-tight mb-1.5">Sign in</h2>
          <p className="text-sm text-text-secondary mb-8">Enter your credentials to continue</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-6 font-medium animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="you@company.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type={showPw ? "text" : "password"} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : <><span>Sign In</span> <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:text-primary-dark transition-colors">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
