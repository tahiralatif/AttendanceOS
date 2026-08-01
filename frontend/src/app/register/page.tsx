"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Lock, User, Building2, Loader2, Eye, EyeOff, Check } from "lucide-react";

const perks = ["No credit card required", "Free for up to 10 employees", "Cancel anytime"];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", organization_name: "", organization_slug: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleOrgName = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 40);
    setForm({ ...form, organization_name: name, organization_slug: slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${window.location.origin}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Registration failed"); return; }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      router.push("/dashboard");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col lg:flex-row">
      {/* ── Left: Branding ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary via-primary-dark to-primary-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-24 left-16 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-12 w-96 h-96 bg-cream rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-14 xl:px-20">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-white/90 font-bold text-xl tracking-tight">AttendanceOS</span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-5">
            Start tracking<br />in minutes
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm mb-10">
            Set up your organization, invite your team, and start managing attendance today.
          </p>
          <div className="space-y-3.5">
            {perks.map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-10 min-h-screen lg:min-h-0">
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm shadow-primary/20">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg text-text tracking-tight">AttendanceOS</span>
          </div>

          <h2 className="text-2xl font-extrabold text-text tracking-tight mb-1.5">Create your account</h2>
          <p className="text-sm text-text-secondary mb-7">Set up your organization in seconds</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-5 font-medium animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="text" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="John Doe" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="you@company.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Organization Name</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="text" required value={form.organization_name}
                  onChange={(e) => handleOrgName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="Acme Corp" />
              </div>
              {form.organization_slug && (
                <p className="text-[11px] text-text-muted mt-1.5 ml-1">Slug: <span className="font-mono text-text-secondary">{form.organization_slug}</span></p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type={showPw ? "text" : "password"} required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-1">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : <><span>Create Account</span> <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-primary-dark transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
