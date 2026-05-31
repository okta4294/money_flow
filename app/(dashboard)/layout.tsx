"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/Sidebar";
import { LayoutDashboard, ArrowLeftRight, Tag, Menu, TrendingUp, LogOut, CreditCard, Landmark } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/categories", label: "Kategori", icon: Tag },
  { href: "/accounts", label: "Akun", icon: Landmark },
  { href: "/debts", label: "Hutang", icon: CreditCard },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Mobile Top Bar — fixed ke viewport, di luar scroll container */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <TrendingUp size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">Money Flow</span>
        </div>
        <button
          onClick={signOut}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Mobile Bottom Nav — fixed ke viewport, di luar scroll container */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex justify-around py-2 shadow-2xl">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors ${
                active ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon size={18} className={`mb-1 transition-all ${active ? "text-emerald-400 scale-110" : "text-slate-500"}`} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Layout wrapper — h-screen agar tidak overflow ke body */}
      <div className="h-screen bg-slate-950 flex">
        <Sidebar />

        {/* Main Content — satu-satunya area yang bisa di-scroll */}
        <main className="flex-1 overflow-y-auto lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
          <div className="p-4 lg:p-8 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
