"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/Sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Home", icon: "dashboard" },
  { href: "/transactions", label: "History", icon: "sync_alt" },
  { href: "/categories", label: "Kategori", icon: "sell" },
  { href: "/accounts", label: "Accounts", icon: "account_balance" },
  { href: "/debts", label: "Hutang", icon: "credit_card" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 dark:border-primary-fixed-dim border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Top App Bar (Mobile) */}
      <header className="flex justify-between items-center w-full px-margin-mobile h-16 fixed top-0 z-50 bg-white/80 dark:bg-surface/80 backdrop-blur-md border-b border-slate-200 dark:border-outline-variant/10 md:hidden transition-colors">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt="User Avatar"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-outline-variant/30 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-primary-container flex items-center justify-center text-emerald-700 dark:text-on-primary-container font-bold text-sm">
              {(user?.displayName || user?.email || "U")[0].toUpperCase()}
            </div>
          )}
          <h1 className="font-headline-md text-[20px] font-bold text-emerald-600 dark:text-primary-fixed-dim">Money Flow</h1>
        </div>
        <div className="flex items-center gap-1">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 dark:text-primary-fixed-dim hover:bg-slate-100 dark:hover:bg-surface-variant/50 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>
          )}
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 dark:text-primary-fixed-dim hover:bg-slate-100 dark:hover:bg-surface-variant/50 transition-colors">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
        </div>
      </header>

      {/* Bottom Nav Bar (Mobile) */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe bg-white/90 dark:bg-surface-container/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border-t border-slate-200 dark:border-white/5 md:hidden transition-colors">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 transition-all duration-200 ${
                active
                  ? "bg-emerald-50 dark:bg-secondary-container text-emerald-600 dark:text-on-secondary-container rounded-xl py-1 scale-105"
                  : "text-slate-400 dark:text-on-surface-variant opacity-70 hover:text-emerald-600 dark:hover:text-primary-fixed-dim"
              }`}
            >
              <span className="material-symbols-outlined text-[20px] mb-1">{icon}</span>
              <span className="font-label-sm text-[10px] whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Layout wrapper */}
      <div className="h-screen bg-slate-50 dark:bg-background flex transition-colors">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full md:pl-[280px] pt-16 md:pt-0 pb-32 md:pb-0 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-margin-mobile md:p-gutter flex flex-col gap-stack-lg max-w-container-max mx-auto min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
