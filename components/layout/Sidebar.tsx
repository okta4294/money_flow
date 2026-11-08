"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "./ThemeToggle";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dasbor",
    icon: "home",
    description: "Ringkasan & batas harian",
  },
  {
    href: "/transactions",
    label: "Transaksi",
    icon: "receipt_long",
    description: "Catat & riwayat mutasi",
  },
  {
    href: "/budget",
    label: "Anggaran Pintar",
    icon: "pie_chart",
    description: "Pos gajian & tabungan 20%",
  },
  {
    href: "/categories",
    label: "Kategori Pos",
    icon: "grid_view",
    description: "Atur pos pemasukan & beban",
  },
  {
    href: "/accounts",
    label: "Dompet & Akun",
    icon: "account_balance_wallet",
    description: "Saldo bank, e-wallet & kas",
  },
  {
    href: "/debts",
    label: "Hutang & Paylater",
    icon: "credit_card",
    description: "Tagihan & cicilan jatuh tempo",
  },
];

interface SidebarProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function Sidebar({
  isExpanded = false,
  onToggleExpand,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside
      className={`fixed left-0 top-0 h-full flex-col z-40 bg-surface-container border-r-[3px] border-outline hidden md:flex justify-between transition-all duration-200 ${
        isExpanded ? "w-64 p-4" : "w-24 py-6 px-3 items-center"
      }`}
    >
      <div
        className={`flex flex-col w-full ${
          isExpanded ? "gap-3" : "items-center gap-3.5"
        }`}
      >
        {/* Header Logo & Tombol Extend/Collapse */}
        {isExpanded ? (
          <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-outline/20">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-primary-container text-on-primary-container border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] flex items-center justify-center shrink-0 font-display-lg text-lg">
                MF
              </div>
              <div className="min-w-0">
                <h1 className="font-headline-md text-sm font-extrabold uppercase tracking-tight text-on-surface truncate">
                  Money Flow
                </h1>
                <p className="font-body-sm text-[10px] text-on-surface-variant truncate">
                  Menu Navigasi Lengkap
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleExpand}
              className="w-9 h-9 rounded-xl bg-surface text-on-surface border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] hover:bg-surface-bright active-press-sm flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title="Ciutkan Sidebar"
              aria-label="Ciutkan Sidebar"
            >
              <span className="material-symbols-outlined text-lg">
                keyboard_double_arrow_left
              </span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5 w-full pb-2 border-b-2 border-outline/20">
            <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] flex items-center justify-center font-display-lg text-lg">
              MF
            </div>
            <button
              type="button"
              onClick={onToggleExpand}
              className="w-12 h-8 rounded-xl bg-secondary-container text-on-secondary-container border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] hover:opacity-90 active-press-sm flex items-center justify-center transition-all cursor-pointer"
              title="Perluas Sidebar & Lihat Keterangan Menu"
              aria-label="Perluas Sidebar"
            >
              <span className="material-symbols-outlined text-lg">
                keyboard_double_arrow_right
              </span>
            </button>
          </div>
        )}

        {/* Daftar Menu Navigasi */}
        <nav
          className={`flex flex-col w-full ${
            isExpanded ? "gap-2" : "items-center gap-2.5"
          }`}
        >
          {NAV_ITEMS.map(({ href, label, icon, description }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                title={isExpanded ? undefined : `${label} (${description})`}
                aria-label={label}
                className={`transition-all ${
                  isExpanded
                    ? `w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 border-2 ${
                        active
                          ? "bg-primary-container text-on-primary-container border-outline shadow-[3px_3px_0_0_var(--theme-outline)] active-press"
                          : "bg-surface text-on-surface border-outline hover:bg-surface-bright"
                      }`
                    : `w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${
                        active
                          ? "bg-primary-container text-on-primary-container border-outline shadow-[3px_3px_0_0_var(--theme-outline)] active-press"
                          : "bg-surface text-on-surface border-outline hover:bg-surface-bright"
                      }`
                }`}
              >
                <span className="material-symbols-outlined text-[22px] shrink-0">
                  {icon}
                </span>
                {isExpanded && (
                  <div className="min-w-0 flex-1">
                    <p className="font-label-bold text-xs uppercase leading-tight truncate">
                      {label}
                    </p>
                    <p
                      className={`font-body-sm text-[10px] leading-tight truncate mt-0.5 ${
                        active
                          ? "text-on-primary-container/85 font-semibold"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {description}
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bagian Bawah: Akun Tamu, Tema, & Keluar */}
      <div
        className={`flex flex-col w-full pt-2 border-t-2 border-outline/20 ${
          isExpanded ? "gap-2" : "items-center gap-2.5"
        }`}
      >
        {user?.isAnonymous && (
          <button
            type="button"
            onClick={signOut}
            className={`transition-colors cursor-pointer border-2 border-outline bg-tertiary-container text-on-tertiary-container shadow-[2px_2px_0_0_var(--theme-outline)] active-press-sm ${
              isExpanded
                ? "w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 text-left"
                : "w-11 h-11 rounded-xl flex items-center justify-center"
            }`}
            title="Daftar / Masuk Akun Tetap"
            aria-label="Daftar atau Masuk Akun Tetap"
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">
              person_add
            </span>
            {isExpanded && (
              <div className="min-w-0 flex-1">
                <p className="font-label-bold text-xs uppercase leading-tight truncate">
                  Akun Tetap
                </p>
                <p className="font-body-sm text-[10px] leading-tight truncate mt-0.5 opacity-85">
                  Simpan data permanen
                </p>
              </div>
            )}
          </button>
        )}

        <div className={isExpanded ? "w-full" : ""}>
          <ThemeToggle showLabel={isExpanded} />
        </div>

        <button
          type="button"
          onClick={signOut}
          className={`transition-colors cursor-pointer border-2 border-outline bg-error-container text-on-error-container shadow-[2px_2px_0_0_var(--theme-outline)] hover:opacity-90 active-press-sm ${
            isExpanded
              ? "w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 text-left"
              : "w-11 h-11 rounded-xl flex items-center justify-center"
          }`}
          title="Keluar Akun"
          aria-label="Keluar Akun"
        >
          <span className="material-symbols-outlined text-[20px] shrink-0">
            logout
          </span>
          {isExpanded && (
            <div className="min-w-0 flex-1">
              <p className="font-label-bold text-xs uppercase leading-tight truncate">
                Keluar Akun
              </p>
              <p className="font-body-sm text-[10px] leading-tight truncate mt-0.5 opacity-90">
                Akhiri sesi aplikasi
              </p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none">
      <div className="w-full max-w-lg mx-auto px-3 sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
        <nav
          aria-label="Navigasi Utama Mobile"
          className="pointer-events-auto flex items-center justify-between gap-1.5 p-2 bg-surface-container border-[3px] border-outline shadow-[3px_3px_0_0_var(--theme-outline)] rounded-2xl transition-colors"
        >
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
                className={`flex-1 h-12 flex items-center justify-center rounded-xl transition-all active-press-sm border-2 ${
                  active
                    ? "bg-primary-container text-on-primary-container border-outline shadow-[2px_2px_0_0_var(--theme-outline)]"
                    : "bg-surface text-on-surface border-outline hover:bg-surface-bright"
                }`}
              >
                <span className="material-symbols-outlined text-[22px] leading-none shrink-0">
                  {icon}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
