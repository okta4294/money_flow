"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  LogOut,
  TrendingUp,
  CreditCard,
  Landmark,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/categories", label: "Kategori", icon: Tag },
  { href: "/accounts", label: "Akun", icon: Landmark },
  { href: "/debts", label: "Hutang", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-slate-900 border-r border-slate-800 fixed top-0 left-0 z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-none">Money Flow</h1>
            <p className="text-slate-500 text-xs mt-0.5">Pencatatan Keuangan</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon
                size={18}
                className={active ? "text-emerald-400" : "text-slate-500 group-hover:text-white transition-colors"}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="px-4 py-4 border-t border-slate-800">
        {user?.isAnonymous ? (
          <div className="mb-2">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-medium">Tamu</p>
                  <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-md">Guest</span>
                </div>
                <p className="text-slate-500 text-xs truncate">Data tidak tersimpan</p>
              </div>
            </div>
            <a
              href="/login"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all duration-200 mb-1"
            >
              Buat Akun / Masuk
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-2">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              className="w-8 h-8 rounded-full ring-2 ring-slate-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
              {(user?.displayName || user?.email || "U")[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.displayName || "Pengguna"}
            </p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
          </div>
        )}
        <button
          id="sidebar-logout"
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
