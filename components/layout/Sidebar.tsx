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
      aria-label="Navigasi Utama"
      className={`fixed left-0 top-0 h-dvh flex-col z-40 bg-surface-container border-r-2 border-outline hidden md:flex transition-all duration-200 overflow-hidden ${
        isExpanded ? "w-64 p-4" : "w-24 py-5 px-3 items-center"
      }`}
    >
      {/* Header Logo & Tombol Extend/Collapse (Pinned Top) */}
      <div
        className={`w-full shrink-0 pb-3 border-b border-outline/20 ${
          isExpanded
            ? "flex items-center justify-between gap-2"
            : "flex flex-col items-center gap-2.5"
        }`}
      >
        {isExpanded ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] flex items-center justify-center shrink-0 font-display-lg font-extrabold text-base">
                MF
              </div>
              <div className="min-w-0">
                <h1 className="font-headline-md text-sm font-extrabold uppercase tracking-tight text-on-surface truncate">
                  Money Flow
                </h1>
                <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                  Catatan Keuangan
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleExpand}
              aria-expanded={isExpanded}
              className="w-9 h-9 rounded-xl bg-surface text-on-surface-variant hover:text-on-surface border border-outline/40 hover:border-outline active-press-sm flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title="Ciutkan Sidebar"
              aria-label="Ciutkan Sidebar"
            >
              <span className="material-symbols-outlined text-lg">
                keyboard_double_arrow_left
              </span>
            </button>
          </>
        ) : (
          <>
            <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] flex items-center justify-center font-display-lg font-extrabold text-base">
              MF
            </div>
            <button
              type="button"
              onClick={onToggleExpand}
              aria-expanded={isExpanded}
              className="w-11 h-8 rounded-xl bg-surface text-on-surface-variant hover:text-on-surface border border-outline/40 hover:border-outline active-press-sm flex items-center justify-center transition-colors cursor-pointer"
              title="Perluas Sidebar & Lihat Keterangan Menu"
              aria-label="Perluas Sidebar"
            >
              <span className="material-symbols-outlined text-lg">
                keyboard_double_arrow_right
              </span>
            </button>
          </>
        )}
      </div>

      {/* Daftar Menu Navigasi (Scrollable Middle Region) */}
      <nav
        aria-label="Menu Halaman"
        className={`flex-1 min-h-0 overflow-y-auto no-scrollbar w-full py-3 flex flex-col ${
          isExpanded ? "gap-1.5" : "items-center gap-2"
        }`}
      >
        {NAV_ITEMS.map(({ href, label, icon, description }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              title={isExpanded ? undefined : `${label} (${description})`}
              aria-label={label}
              className={`shrink-0 transition-all ${
                isExpanded
                  ? `w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 border-2 ${
                      active
                        ? "bg-primary-container text-on-primary-container border-outline shadow-[2px_2px_0_0_var(--theme-outline)] active-press-sm"
                        : "bg-transparent text-on-surface border-transparent hover:bg-surface/80 hover:border-outline/25"
                    }`
                  : `w-11 h-11 rounded-xl flex items-center justify-center border-2 ${
                      active
                        ? "bg-primary-container text-on-primary-container border-outline shadow-[2px_2px_0_0_var(--theme-outline)] active-press-sm"
                        : "bg-transparent text-on-surface-variant hover:text-on-surface border-transparent hover:bg-surface/80 hover:border-outline/25"
                    }`
              }`}
            >
              <span className="material-symbols-outlined text-[22px] shrink-0">
                {icon}
              </span>
              {isExpanded && (
                <div className="min-w-0 flex-1">
                  <p className="font-label-bold text-xs leading-tight truncate">
                    {label}
                  </p>
                  <p
                    className={`font-body-sm text-[11px] leading-tight truncate mt-0.5 ${
                      active
                        ? "text-on-primary-container/80 font-medium"
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

      {/* Bagian Bawah: Akun Tamu, Tema, & Keluar (Pinned Bottom) */}
      <div
        className={`w-full shrink-0 pt-3 border-t border-outline/20 flex flex-col ${
          isExpanded ? "gap-2" : "items-center gap-2"
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
                <p className="font-label-bold text-xs leading-tight truncate">
                  Akun Tetap
                </p>
                <p className="font-body-sm text-[11px] leading-tight truncate mt-0.5 opacity-85">
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
          className={`transition-colors cursor-pointer border border-outline/40 bg-surface text-on-surface-variant hover:bg-error-container hover:text-on-error-container hover:border-outline active-press-sm ${
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
              <p className="font-label-bold text-xs leading-tight truncate">
                Keluar Akun
              </p>
              <p className="font-body-sm text-[11px] leading-tight truncate mt-0.5 opacity-80">
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
          className="pointer-events-auto flex items-center justify-between gap-1.5 p-2 bg-surface-container border-2 border-outline shadow-[3px_3px_0_0_var(--theme-outline)] rounded-2xl transition-colors"
        >
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                title={label}
                aria-label={label}
                className={`flex-1 h-12 flex items-center justify-center rounded-xl transition-all active-press-sm border-2 ${
                  active
                    ? "bg-primary-container text-on-primary-container border-outline shadow-[2px_2px_0_0_var(--theme-outline)]"
                    : "bg-transparent text-on-surface-variant border-transparent hover:bg-surface/80 hover:text-on-surface"
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
