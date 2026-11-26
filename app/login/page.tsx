export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Masuk - Money Flow",
  description: "Mencatat jalur keuangan dan arus kas Anda sejak dini",
};

export default function LoginPage() {
  return (
    <div className="min-h-dvh text-on-background flex flex-col justify-center px-5 py-10 md:p-8 relative overflow-y-auto overflow-x-hidden">
      <div className="relative z-10 w-full max-w-[440px] mx-auto shrink-0">
        <LoginForm />
      </div>
    </div>
  );
}
