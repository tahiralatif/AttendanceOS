"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (["org_admin", "hr_admin", "manager"].includes(d.role)) {
          router.push("/admin");
        } else {
          router.push("/employee");
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <Loader2 size={24} className="animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm text-text-secondary font-medium">Redirecting...</p>
      </div>
    </div>
  );
}
