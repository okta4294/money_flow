"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
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
      <div className="h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <header className="flex justify-between items-center px-container-padding py-4 w-full bg-surface sticky top-0 z-50 neo-brutalist-border md:hidden transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-container neo-brutalist-border rounded-full flex items-center justify-center neo-brutalist-shadow overflow-hidden">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt="User Avatar"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-lg text-on-primary-container">{(user?.displayName || user?.email || "U")[0].toUpperCase()}</span>
            )}
          </div>
          <h1 className="font-display-lg text-headline-md text-primary uppercase tracking-tighter">My Wallet</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe pt-2 bg-surface neo-brutalist-border border-b-0 border-l-0 border-r-0 md:hidden transition-colors">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center py-2 transition-all ${
                active
                  ? "bg-primary-container text-on-primary-container neo-brutalist-border rounded-lg px-3 -translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  : "text-on-surface-variant hover:text-on-background"
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span className="font-label-bold text-[10px] mt-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Layout wrapper */}
      <div className="min-h-screen bg-surface flex transition-colors">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 w-full md:pl-24 pb-24 md:pb-0 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="px-6 py-6 md:p-8 flex flex-col gap-6 max-w-6xl mx-auto min-h-full pb-32"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
