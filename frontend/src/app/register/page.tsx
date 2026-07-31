"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    organization_name: "",
    organization_slug: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOrgName = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40);
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

      if (!res.ok) {
        setError(data.detail || "Registration failed");
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col lg:flex-row">
      {/* Left — Branding (hidden on mobile/tablet, shown on lg+) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary via-secondary-dark to-accent relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cream rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-white/90 font-semibold text-xl">AttendanceOS</span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            Start tracking
            <br />
            in minutes
          </h1>
          <p className="text-white/70 text-base lg:text-lg leading-relaxed max-w-md">
            Set up your organization, invite your team, and start managing attendance today.
            Free for up to 10 employees.
          </p>
          <div className="mt-8 sm:mt-10 space-y-3">
            {["No credit card required", "Free for up to 10 employees", "Cancel anytime"].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-12 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6 sm:mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-lg text-text">AttendanceOS</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-text mb-2">Create your account</h2>
          <p className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">
            Set up your organization in seconds
          </p>

          {error && (
            <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-xl mb-5 sm:mb-6 animate-scale-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Your name</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted text-sm transition-all hover:border-primary/40 focus:border-primary"
                placeholder="John Harris"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted text-sm transition-all hover:border-primary/40 focus:border-primary"
                placeholder="john@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Organization name</label>
              <input
                type="text"
                required
                value={form.organization_name}
                onChange={(e) => handleOrgName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted text-sm transition-all hover:border-primary/40 focus:border-primary"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Workspace URL</label>
              {/* Stacked on mobile, inline on sm+ */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                <span className="text-xs sm:text-sm text-text-muted sm:mr-1 shrink-0">attendanceos.com/</span>
                <input
                  type="text"
                  required
                  value={form.organization_slug}
                  onChange={(e) => setForm({ ...form, organization_slug: e.target.value })}
                  className="flex-1 min-w-0 px-3 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted text-sm transition-all hover:border-primary/40 focus:border-primary"
                  placeholder="acme-corp"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted text-sm transition-all hover:border-primary/40 focus:border-primary"
                placeholder="Min. 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-medium text-sm hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="mt-5 sm:mt-6 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:text-primary-dark transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
