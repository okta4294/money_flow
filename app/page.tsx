"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) router.replace("/dashboard");
      else router.replace("/login");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-primary-container border-2 border-outline rounded-2xl flex items-center justify-center shadow-[2px_2px_0_0_var(--theme-outline)]">
          <span className="material-symbols-outlined text-2xl text-on-primary-container animate-spin">progress_activity</span>
        </div>
        <p className="text-on-surface-variant font-label-bold text-xs uppercase tracking-wider">Memuat...</p>
      </div>
    </div>
  );
}
