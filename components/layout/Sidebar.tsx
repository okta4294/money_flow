"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "fa-solid fa-border-all" },
  { href: "/transactions", label: "Transaksi", icon: "fa-solid fa-right-left" },
  { href: "/categories", label: "Kategori", icon: "fa-solid fa-tags" },
  { href: "/accounts", label: "Akun", icon: "fa-solid fa-building-columns" },
  { href: "/debts", label: "Hutang", icon: "fa-solid fa-money-bill-trend-up" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <nav className="glass-panel fixed left-4 top-4 bottom-4 w-[280px] rounded-2xl z-50 flex-col justify-between hidden md:flex shadow-2xl">
      <div className="flex flex-col gap-stack-lg p-stack-md flex-1">
        {/* Header */}
        <div className="flex items-center gap-stack-md px-stack-md py-4">
          <div className="w-10 h-10 flex items-center justify-center">
            {user?.photoURL ? (
              <Image src={user.photoURL} alt="User Avatar" width={40} height={40} className="rounded-full border border-primary-fixed/30" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-lg border border-primary-fixed/30 shadow-[0_0_10px_rgba(99,247,255,0.2)]">
                {(user?.displayName || user?.email || "M")[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-fixed to-secondary-fixed drop-shadow-[0_0_5px_rgba(99,247,255,0.3)]">Money Flow</h1>
            <p className="font-label-sm text-label-sm text-primary-fixed/60">Financial Mastery</p>
          </div>
        </div>

        {/* Navigation Links */}
        <ul className="flex flex-col gap-stack-sm">
          {navItems.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-stack-md px-stack-md py-3 rounded-xl active:scale-95 transform transition-all ${
                    active
                      ? "text-primary-fixed bg-primary-fixed/10 border border-primary-fixed/20 shadow-[0_0_15px_rgba(99,247,255,0.1)]"
                      : "text-on-surface-variant hover:text-primary-fixed hover:bg-primary-fixed/5"
                  }`}
                >
                  <i className={`${icon} ${active ? "text-primary-fixed" : "text-on-surface-variant"} text-xl w-6 text-center`}></i>
                  <span className="font-label-md text-label-md">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* CTA (Add Transaction) is moved to floating action button or handled per page, but we can keep a stub or remove it since it was handled by FAB previously */}
      </div>

      {/* Footer Links / User Actions */}
      <div className="flex flex-col gap-stack-sm p-stack-md mb-4 border-t border-white/5 pt-4">
        {user?.isAnonymous && (
          <a
            href="/login"
            className="flex items-center gap-stack-md px-stack-md py-3 text-primary-fixed hover:bg-primary-fixed/5 transition-colors duration-200 rounded-xl active:scale-95 transform shadow-[0_0_10px_rgba(99,247,255,0.1)] mb-2"
          >
            <i className="fa-solid fa-user-plus w-6 text-center text-xl"></i>
            <span className="font-label-md text-label-md">Buat Akun / Masuk</span>
          </a>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <ThemeToggle />
          <button
            onClick={signOut}
            className="flex items-center justify-center w-10 h-10 text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors duration-200 rounded-full active:scale-95 transform"
            title="Keluar"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-xl"></i>
          </button>
        </div>
      </div>
    </nav>
  );
}
