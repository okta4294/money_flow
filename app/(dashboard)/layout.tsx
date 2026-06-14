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
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Home", icon: "fa-solid fa-border-all" },
  { href: "/transactions", label: "History", icon: "fa-solid fa-right-left" },
  { href: "/categories", label: "Kategori", icon: "fa-solid fa-tags" },
  { href: "/accounts", label: "Accounts", icon: "fa-solid fa-building-columns" },
  { href: "/debts", label: "Hutang", icon: "fa-solid fa-money-bill-trend-up" },
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
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-fixed border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <header className="flex justify-between items-center w-full px-6 h-16 fixed top-0 z-50 glass-panel border-b border-white/10 md:hidden transition-colors">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt="User Avatar"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
              {(user?.displayName || user?.email || "U")[0].toUpperCase()}
            </div>
          )}
          <h1 className="font-headline-md text-[20px] font-bold text-primary-fixed-dim drop-shadow-[0_0_8px_rgba(99,247,255,0.4)]">Money Flow</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-primary-fixed hover:bg-white/5 transition-colors">
            <i className="fa-solid fa-magnifying-glass text-xl"></i>
          </button>
        </div>
      </header>

      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-6 py-3 pb-safe glass-panel border-t border-white/10 md:hidden transition-colors">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 transition-all duration-200 ${
                active
                  ? "bg-secondary-container/20 border border-secondary-container/30 text-secondary-fixed rounded-xl py-1 scale-105 shadow-[0_0_15px_rgba(111,0,190,0.2)]"
                  : "text-on-surface-variant opacity-70 hover:text-primary-fixed"
              }`}
            >
              <i className={`${icon} text-xl mb-1`}></i>
              <span className="font-label-sm text-[10px] whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Layout wrapper */}
      <div className="h-screen bg-background flex transition-colors">
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
              className="px-6 py-6 md:p-8 flex flex-col gap-6 max-w-[1440px] mx-auto min-h-full pb-32"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
