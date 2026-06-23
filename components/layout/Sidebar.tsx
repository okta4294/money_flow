"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/transactions", label: "Transactions", icon: "history" },
  { href: "/categories", label: "Categories", icon: "category" },
  { href: "/accounts", label: "Accounts", icon: "account_balance_wallet" },
  { href: "/debts", label: "Debt Tracker", icon: "account_balance" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full flex-col p-4 z-40 bg-surface neo-brutalist-border border-l-0 border-t-0 border-b-0 w-24 hidden md:flex items-center gap-8 py-8">
      {/* Header icon / Home */}
      <Link href="/dashboard" className="p-3 bg-primary-container neo-brutalist-border rounded-lg neo-brutalist-shadow-sm cursor-pointer active-press group hover:bg-secondary-container transition-colors">
        <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">bolt</span>
      </Link>

      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-4 w-full">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`p-3 rounded-lg flex items-center justify-center transition-all ${
                active
                  ? "bg-primary-container text-on-primary-container neo-brutalist-border neo-brutalist-shadow-sm active-press"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
              title={label}
            >
              <span className="material-symbols-outlined text-2xl">{icon}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Navigation */}
      <div className="flex flex-col gap-4 mt-auto w-full items-center">
        {user?.isAnonymous && (
          <a
            href="/login"
            className="p-3 rounded-lg flex items-center justify-center text-primary-fixed hover:bg-surface-container-high transition-colors"
            title="Log In"
          >
            <span className="material-symbols-outlined text-2xl">person_add</span>
          </a>
        )}
        <div className="p-3">
          <ThemeToggle />
        </div>
        <button
          onClick={signOut}
          className="p-3 rounded-lg flex items-center justify-center text-error hover:bg-error-container transition-colors"
          title="Log Out"
        >
          <span className="material-symbols-outlined text-2xl">logout</span>
        </button>
      </div>
    </aside>
  );
}
