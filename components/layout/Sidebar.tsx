"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/transactions", label: "Transaksi", icon: "sync_alt" },
  { href: "/categories", label: "Kategori", icon: "sell" },
  { href: "/accounts", label: "Akun", icon: "account_balance" },
  { href: "/debts", label: "Hutang", icon: "credit_card" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside className="hidden lg:flex flex-col w-[280px] h-screen fixed left-0 top-0 bg-white dark:bg-surface-container border-r border-slate-200 dark:border-outline-variant/10 py-6 px-4 z-40 transition-colors duration-200">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 flex items-center justify-center">
          <Image src="/logo.svg" alt="Money Flow Logo" width={40} height={40} className="drop-shadow-md" />
        </div>
        <div>
          <h1 className="font-headline-md text-emerald-600 dark:text-primary-fixed-dim text-lg">Money Flow</h1>
          <p className="font-label-sm text-slate-500 dark:text-on-surface-variant/60">Pencatatan Keuangan</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-2">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active
                  ? "bg-emerald-50 dark:bg-secondary-container/20 text-emerald-600 dark:text-secondary-fixed-dim border border-emerald-100 dark:border-secondary-container/30"
                  : "text-slate-500 dark:text-on-surface-variant hover:bg-slate-50 dark:hover:bg-surface-variant/50"
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${active ? "text-emerald-600 dark:text-secondary-fixed-dim" : "text-slate-500 dark:text-on-surface-variant"}`}>
                {icon}
              </span>
              <span className={`font-label-md ${active ? "font-semibold" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="mt-auto border-t border-slate-200 dark:border-outline-variant/10 pt-4 flex flex-col gap-2">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-slate-500 dark:text-on-surface-variant hover:bg-slate-50 dark:hover:bg-surface-variant/50 transition-colors w-full"
          >
            <span className="material-symbols-outlined text-[18px]">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
            <span className="font-label-md">
              {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
            </span>
          </button>
        )}

        {user?.isAnonymous ? (
          <div className="mb-2">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-surface-variant flex items-center justify-center text-slate-500 dark:text-on-surface-variant">
                <span className="material-symbols-outlined">person</span>
              </div>
              <div className="overflow-hidden flex-1">
                <p className="font-label-md text-slate-900 dark:text-on-surface truncate">Tamu</p>
                <p className="font-label-sm text-slate-500 dark:text-on-surface-variant/70 truncate">Data tidak tersimpan</p>
              </div>
            </div>
            <a
              href="/login"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-emerald-600 dark:text-primary-fixed-dim bg-emerald-50 dark:bg-primary-fixed-dim/10 hover:bg-emerald-100 dark:hover:bg-primary-fixed-dim/20 border border-emerald-200 dark:border-primary-fixed-dim/20 transition-all duration-200 mb-1"
            >
              Buat Akun / Masuk
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || "User"}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-outline-variant/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-primary-fixed-dim flex items-center justify-center text-emerald-700 dark:text-on-primary-fixed text-lg font-bold">
                {(user?.displayName || user?.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="font-label-md text-slate-900 dark:text-on-surface truncate">
                {user?.displayName || "Pengguna"}
              </p>
              <p className="font-label-sm text-slate-500 dark:text-on-surface-variant/70 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-500 dark:text-on-surface-variant hover:text-red-500 dark:hover:text-error hover:bg-red-50 dark:hover:bg-error-container/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span className="font-label-md">Keluar</span>
        </button>
      </div>
    </aside>
  );
}
