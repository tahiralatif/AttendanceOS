"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff } from "lucide-react";

interface InviteData {
  email: string;
  full_name: string;
  department: string | null;
  designation: string | null;
  status: string;
  expires_at: string;
}

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided");
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        const res = await fetch(`/api/v1/employees/invite/${token}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.detail || "Invalid invitation");
          return;
        }
        const data = await res.json();
        setInvite(data);
      } catch {
        setError("Failed to validate invitation");
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/employees/invite/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Failed to accept invitation");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-text-secondary font-medium">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-5">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-text tracking-tight mb-2">You&apos;re all set!</h1>
          <p className="text-sm text-text-secondary mb-8 leading-relaxed">
            Your password has been set. You can now log in to access your attendance dashboard.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-5">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-text tracking-tight mb-2">Invitation Invalid</h1>
          <p className="text-sm text-text-secondary mb-8 leading-relaxed">{error}</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm shadow-primary/20">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-lg text-text tracking-tight">AttendanceOS</span>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-6 sm:p-8">
          <h1 className="text-xl font-extrabold text-text tracking-tight mb-1">Set your password</h1>
          <p className="text-sm text-text-secondary mb-6">
            Welcome, <span className="font-semibold text-text">{invite?.full_name}</span>! Create your password to get started.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-5 font-medium animate-fade-in">
              {error}
            </div>
          )}

          <div className="bg-surface/60 rounded-xl px-4 py-3 mb-5 border border-black/[0.04]">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">Email</p>
            <p className="text-sm font-semibold text-text">{invite?.email}</p>
            {invite?.department && (
              <p className="text-xs text-text-secondary mt-1">
                {invite.department}{invite.designation ? ` · ${invite.designation}` : ""}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="Min. 8 characters"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-text placeholder-text-muted/60 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="Repeat your password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-1"
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Setting password...</>
              ) : (
                "Set Password & Continue"
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-text-muted">
          This invitation expires in 7 days.
        </p>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
