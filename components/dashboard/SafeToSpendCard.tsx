"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatRupiah } from "@/lib/utils";
import {
  BudgetRecommendationResult,
  DailyLimitCheckResult,
} from "@/lib/budget-calculator";

interface SafeToSpendCardProps {
  budget: BudgetRecommendationResult | null;
  dailyCheck: DailyLimitCheckResult | null;
  loading: boolean;
}

export function SafeToSpendCard({
  budget,
  dailyCheck,
  loading,
}: SafeToSpendCardProps) {
  if (loading || !budget) {
    return (
      <div className="col-span-12 bg-surface-container border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] p-5 rounded-3xl animate-pulse space-y-3">
        <div className="h-5 w-40 bg-surface-bright rounded"></div>
        <div className="h-16 w-full bg-surface-bright rounded-2xl"></div>
      </div>
    );
  }

  const { remainingDays, dailyBudget, dailyEssentialBudget, dailyDiscretionaryBudget, budgetCycle } = budget;
  const isOverBudget = dailyCheck?.isOverBudget ?? false;
  const overAmount = dailyCheck?.overAmount ?? 0;
  const eligibleDailySpending = dailyCheck?.eligibleDailySpending ?? 0;
  const essentialDailySpending = dailyCheck?.essentialDailySpending ?? 0;
  const discretionaryDailySpending = dailyCheck?.discretionaryDailySpending ?? 0;

  const essentialRemaining = Math.max(0, dailyEssentialBudget - essentialDailySpending);
  const discretionaryRemaining = Math.max(0, dailyDiscretionaryBudget - discretionaryDailySpending);

  const dailyRemainingBalance = Math.max(0, dailyBudget - eligibleDailySpending);
  const percentUsed =
    dailyBudget > 0
      ? Math.round((eligibleDailySpending / dailyBudget) * 100)
      : eligibleDailySpending > 0
      ? 100
      : 0;
  const dailyProgressPercent = Math.min(100, percentUsed);

  return (
    <motion.section
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="col-span-12 bg-surface border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] rounded-3xl p-5 sm:p-6 flex flex-col gap-4"
    >
      {/* Baris Header sesuai FigCraft Frame 01 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="font-headline-md text-sm sm:text-base md:text-lg text-on-surface uppercase font-extrabold tracking-tight">
            Batas Belanja Hari Ini
          </h3>
          <span className="h-9 inline-flex items-center px-3 text-[10px] sm:text-xs font-label-bold uppercase bg-tertiary-container text-on-tertiary-container rounded-xl border-2 border-outline shadow-[1.5px_1.5px_0_0_var(--theme-outline)]">
            {budgetCycle?.isPaydayCycle
              ? `Siklus Gajian • ${budgetCycle.label} (${remainingDays} Hari Lagi)`
              : `Siklus Bulanan • ${remainingDays} Hari Tersisa`}
          </span>
        </div>

        <Link
          href="/budget"
          className="h-9 px-3.5 inline-flex items-center bg-primary-container hover:opacity-95 border-2 border-outline rounded-xl text-on-primary-container font-label-bold text-[11px] sm:text-xs uppercase active-press-sm shadow-[2px_2px_0_0_var(--theme-outline)] shrink-0"
        >
          <span>Rincian Anggaran</span>
        </Link>
      </div>

      {/* Baris Bento 3 Kolom: Progress Utama + Kuota Pokok Kuning + Kuota Sekunder Biru */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Kolom Kiri (6 kolom): Progress Total Jatah Hari Ini */}
        <div
          className={`lg:col-span-6 rounded-2xl border-[3px] border-outline p-4 flex flex-col justify-between gap-3 shadow-[2px_2px_0_0_var(--theme-outline)] ${
            isOverBudget
              ? "bg-error-container text-on-error-container"
              : "bg-background text-on-surface"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-label-bold text-xs sm:text-sm uppercase font-extrabold">
              {isOverBudget
                ? `Melewati Batas: +${formatRupiah(overAmount)}`
                : `Sisa Total Jatah Hari Ini: ${formatRupiah(dailyRemainingBalance)}`}
            </span>
            <span
              className={`text-[11px] font-label-bold uppercase px-2 py-0.5 rounded-lg border border-outline ${
                isOverBudget
                  ? "bg-surface text-error font-extrabold"
                  : percentUsed >= 80
                  ? "bg-primary-container text-on-primary-container"
                  : "text-tertiary dark:text-tertiary-fixed font-extrabold"
              }`}
            >
              {percentUsed}% Terpakai •{" "}
              {isOverBudget
                ? "Lewat Kuota!"
                : percentUsed >= 80
                ? "Hampir Habis"
                : "Aman Terkendali"}
            </span>
          </div>

          <div className="h-5 w-full bg-surface-container-high border-2 border-outline rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${isOverBudget ? 100 : dailyProgressPercent}%` }}
              transition={{ duration: 0.6, type: "spring" }}
              className={`h-full border-r-2 border-outline ${
                isOverBudget
                  ? "bg-error"
                  : percentUsed >= 80
                  ? "bg-primary-container"
                  : "bg-tertiary-container"
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-body-md opacity-90">
            <span>
              Terpakai {formatRupiah(eligibleDailySpending)} dari batas harian{" "}
              {formatRupiah(dailyBudget)} (Hutang & tagihan tetap dikecualikan)
            </span>
            {dailyCheck && dailyCheck.excludedCount > 0 && (
              <span className="font-label-bold underline">
                +{dailyCheck.excludedCount} transaksi tetap dikecualikan
              </span>
            )}
          </div>
        </div>

        {/* Kolom Tengah (3 kolom): Sisa Kuota Pokok Harian (Cartoon Yellow) */}
        <div className="lg:col-span-3 bg-primary-container text-on-primary-container rounded-2xl border-[3px] border-outline p-4 shadow-[2px_2px_0_0_var(--theme-outline)] flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label-bold text-[11px] uppercase tracking-wide font-extrabold">
              Sisa Kuota Pokok Harian
            </span>
            <span className="material-symbols-outlined text-base">
              restaurant
            </span>
          </div>
          <p className="font-display-lg text-xl sm:text-2xl font-black tracking-tight leading-tight">
            {formatRupiah(essentialRemaining)}{" "}
            <span className="text-xs font-label-bold uppercase">/ hari</span>
          </p>
          <p className="text-[11px] font-body-md opacity-90 leading-snug">
            Makan, Minum, Bensin & Dapur
            {essentialDailySpending > 0 &&
              ` • Terpakai ${formatRupiah(essentialDailySpending)}`}
          </p>
        </div>

        {/* Kolom Kanan (3 kolom): Sisa Kuota Sekunder Harian (Comic Blue) */}
        <div className="lg:col-span-3 bg-secondary-container text-on-secondary-container rounded-2xl border-[3px] border-outline p-4 shadow-[2px_2px_0_0_var(--theme-outline)] flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label-bold text-[11px] uppercase tracking-wide font-extrabold">
              Sisa Kuota Sekunder Harian
            </span>
            <span className="material-symbols-outlined text-base">
              local_cafe
            </span>
          </div>
          <p className="font-display-lg text-xl sm:text-2xl font-black tracking-tight leading-tight">
            {formatRupiah(discretionaryRemaining)}{" "}
            <span className="text-xs font-label-bold uppercase">/ hari</span>
          </p>
          <p className="text-[11px] font-body-md opacity-95 leading-snug">
            Nongkrong, Kopi & Hiburan Bebas
            {discretionaryDailySpending > 0 &&
              ` • Terpakai ${formatRupiah(discretionaryDailySpending)}`}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
