export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Masuk — Money Flow",
  description: "Mencatat jalur kemiskinan anda sejak dini",
};

export default function LoginPage() {
  return (
    <div className="h-full bg-background text-on-background flex flex-col px-6 py-12 md:p-8 relative overflow-y-auto overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-no-repeat bg-cover bg-center opacity-20 mix-blend-luminosity scale-105 blur-[16px]" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCfLeXVK_X7-O8oNsYiT3PpDV1_eA0cvGtSzYvh4dwE4gwbf_n_Zjy267iv-whztZy1764o3-QpiF4UIkK42NLtr2FcuFXhxFkpDPxG3yU0osfKu8cV-DIPb52k8SPc7IyC7fh_YuZJcCAuqESfefDGYYmdkEpWT1TmlpNcuqghVH9PA70mH2Ug2JwJeT4sMRZRwmP71kEY5rJbYE4wyU3W6CstlpsgwgABnYgpVNx2DQnR_Pwcj1edASnaLTS__aD9u8LmMaG5S84')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background to-background" />
      </div>

      <div className="flex-1 min-h-[20px]"></div>
      <div className="relative z-10 w-full max-w-[420px] mx-auto shrink-0">
        <LoginForm />
      </div>
      <div className="flex-1 min-h-[20px]"></div>
    </div>
  );
}
