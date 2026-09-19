"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/Sidebar";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/transactions", label: "History", icon: "history" },
  { href: "/categories", label: "Categories", icon: "category" },
  { href: "/accounts", label: "Accounts", icon: "account_balance_wallet" },
  { href: "/debts", label: "Debt", icon: "account_balance" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <header className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 w-full bg-surface sticky top-0 z-40 md:hidden transition-colors border-b-[3px] border-outline shadow-[0_3px_0_0_var(--theme-outline)]">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-container border-2 border-outline rounded-full flex items-center justify-center shadow-[2px_2px_0_0_var(--theme-outline)] overflow-hidden">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt="User Avatar"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-base sm:text-lg text-on-primary-container">{(user?.displayName || user?.email || "U")[0].toUpperCase()}</span>
            )}
          </motion.div>
          <h1 className="font-display-lg text-xl sm:text-2xl text-primary uppercase tracking-tighter" style={{ WebkitTextStroke: '0.5px var(--theme-outline)', color: 'var(--theme-primary-container)' }}>My Wallet</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
        </div>
      </header>

      <nav className="fixed bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-50 flex justify-around items-center px-1.5 py-1.5 bg-surface border-2 border-outline shadow-[3px_3px_0_0_var(--theme-outline)] rounded-2xl md:hidden transition-colors">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center py-1.5 px-2.5 sm:px-3 rounded-xl transition-all active-press-sm ${
                active
                  ? "bg-primary-container text-on-primary-container shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]"
                  : "text-on-surface-variant hover:text-on-background"
              }`}
            >
              <motion.span whileHover={{ y: -2 }} className="material-symbols-outlined text-[20px] sm:text-[24px]">{icon}</motion.span>
              <span className={`font-label-bold text-[9px] sm:text-[10px] mt-0.5 ${active ? "opacity-100" : "opacity-70"}`}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="min-h-screen bg-surface flex transition-colors">
        <Sidebar />

        <main className="flex-1 w-full md:pl-24 pb-24 md:pb-0 relative">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="px-4 py-4 sm:px-6 sm:py-6 md:p-8 flex flex-col gap-6 max-w-6xl mx-auto min-h-full pb-32"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
