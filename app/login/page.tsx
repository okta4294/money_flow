export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Masuk - Money Flow",
  description: "Mencatat jalur keuangan dan arus kas Anda sejak dini",
};

export default function LoginPage() {
  return (
    <div className="h-full bg-background text-on-background flex flex-col px-6 py-12 md:p-8 relative overflow-y-auto overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(var(--theme-outline)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="flex-1 min-h-[20px]"></div>
      <div className="relative z-10 w-full max-w-[420px] mx-auto shrink-0">
        <LoginForm />
      </div>
      <div className="flex-1 min-h-[20px]"></div>
    </div>
  );
}
