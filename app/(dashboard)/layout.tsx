"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar, BottomNav } from "@/components/layout/Sidebar";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const SIDEBAR_STORAGE_KEY = "money_flow_sidebar_expanded";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === "true") {
        setIsSidebarExpanded(true);
      }
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Abaikan jika localStorage tidak tersedia
      }
      return next;
    });
  };

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
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-container border-2 border-outline rounded-2xl flex items-center justify-center shadow-[2px_2px_0_0_var(--theme-outline)] overflow-hidden">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt="Avatar Pengguna"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-display-lg text-base sm:text-lg text-on-primary-container">MF</span>
            )}
          </motion.div>
          <h1 className="font-display-lg text-xl sm:text-2xl text-primary-container stroke-cartoon uppercase tracking-tighter">Money Flow</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={signOut}
            className="w-11 h-11 rounded-xl bg-error-container text-on-error-container border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] flex items-center justify-center active-press-sm transition-colors cursor-pointer"
            title="Keluar Akun"
            aria-label="Keluar Akun"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </header>

      <div className="min-h-screen bg-surface flex transition-colors overflow-x-clip">
        <Sidebar
          isExpanded={isSidebarExpanded}
          onToggleExpand={handleToggleSidebar}
        />

        <main
          className={`flex-1 min-w-0 w-full max-w-full pb-24 md:pb-0 relative transition-all duration-200 ${
            isSidebarExpanded ? "md:pl-64" : "md:pl-24"
          }`}
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="px-4 py-4 sm:px-6 sm:py-6 md:p-8 flex flex-col gap-6 w-full min-w-0 max-w-6xl mx-auto min-h-full pb-44 md:pb-24"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav />
    </>
  );
}
