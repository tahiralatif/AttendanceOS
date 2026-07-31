"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${window.location.origin}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Login failed"); return; }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      router.push("/dashboard");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-dark to-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cream rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-white/90 font-semibold text-xl">AttendanceOS</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">Welcome back to<br />smarter attendance</h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-md">Track, manage, and report employee attendance with OCR-powered imports and real-time analytics.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><span className="text-white font-bold text-sm">A</span></div>
            <span className="font-semibold text-lg text-text">AttendanceOS</span>
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">Sign in</h2>
          <p className="text-text-secondary mb-8">Enter your credentials to continue</p>
          {error && <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-xl mb-6 animate-scale-in">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted text-sm transition-all hover:border-primary/40 focus:border-primary" placeholder="you@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Password</label>
              <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted text-sm transition-all hover:border-primary/40 focus:border-primary" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-xl font-medium text-sm hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Signing in...</span> : "Sign In"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-text-secondary">Don&apos;t have an account? <Link href="/register" className="text-primary font-medium hover:text-primary-dark transition-colors">Create one free</Link></p>
        </div>
      </div>
    </div>
  );
}