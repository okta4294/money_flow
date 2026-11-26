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
      <div className="col-span-12 bg-surface-container comic-card p-5 animate-pulse space-y-3">
        <div className="h-5 w-40 bg-surface-bright rounded"></div>
        <div className="h-16 w-full bg-surface-bright rounded-xl"></div>
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
    <section className="col-span-12 bg-surface comic-card p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="font-headline-md text-lg text-on-surface font-extrabold tracking-tight">
            Batas Belanja Hari Ini
          </h2>
          <span className="min-h-8 inline-flex items-center px-3 py-1 text-xs font-label-bold font-bold bg-surface-container text-on-surface-variant rounded-lg border-2 border-outline/40">
            {budgetCycle?.isPaydayCycle
              ? `Siklus Gajian • ${budgetCycle.label} (${remainingDays} Hari Lagi)`
              : `Siklus Bulanan • ${remainingDays} Hari Tersisa`}
          </span>
        </div>

        <Link
          href="/budget"
          className="min-h-11 px-4 inline-flex items-center bg-surface-container hover:bg-surface-bright border-2 border-outline rounded-xl text-on-surface font-label-bold font-bold text-xs sm:text-sm active-press-sm shadow-[2px_2px_0_0_var(--theme-outline)] shrink-0"
        >
          <span>Rincian Anggaran</span>
        </Link>
      </div>

      {/* Baris Bento 3 Kolom: Progress Utama + Kuota Pokok + Kuota Sekunder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Kolom Kiri (6 kolom): Progress Total Jatah Hari Ini */}
        <div
          className={`lg:col-span-6 rounded-xl border-2 p-4 flex flex-col justify-between gap-3 ${
            isOverBudget
              ? "bg-error-container/15 border-error text-on-surface"
              : "bg-background border-outline/35 text-on-surface"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-label-bold text-sm font-bold tabular-nums">
              {isOverBudget
                ? `Melewati Batas: +${formatRupiah(overAmount)}`
                : `Sisa Total Jatah Hari Ini: ${formatRupiah(dailyRemainingBalance)}`}
            </span>
            <span
              className={`text-xs font-label-bold font-bold px-2.5 py-0.5 rounded-lg border ${
                isOverBudget
                  ? "bg-error-container text-on-error-container border-error"
                  : percentUsed >= 80
                  ? "bg-primary-container text-on-primary-container border-outline"
                  : "bg-tertiary-container/25 text-tertiary dark:text-tertiary-fixed border-tertiary/50"
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

          <div className="h-3.5 w-full bg-surface-container-high border-2 border-outline/50 rounded-lg overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${isOverBudget ? 100 : dailyProgressPercent}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full sketch-hatch ${
                isOverBudget
                  ? "bg-error"
                  : percentUsed >= 80
                  ? "bg-primary-container"
                  : "bg-tertiary-container"
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-body-md text-on-surface-variant">
            <span className="tabular-nums">
              Terpakai {formatRupiah(eligibleDailySpending)} dari batas harian{" "}
              {formatRupiah(dailyBudget)} (Hutang & tagihan tetap dikecualikan)
            </span>
            {dailyCheck && dailyCheck.excludedCount > 0 && (
              <span className="font-label-bold font-bold underline">
                +{dailyCheck.excludedCount} transaksi tetap dikecualikan
              </span>
            )}
          </div>
        </div>

        {/* Kolom Tengah (3 kolom): Sisa Kuota Pokok Harian */}
        <div className="lg:col-span-3 bg-primary-container/20 dark:bg-primary-container/15 text-on-surface rounded-xl border-2 border-outline/40 p-4 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label-bold font-bold text-xs uppercase tracking-wide text-on-surface-variant">
              Sisa Kuota Pokok
            </span>
            <span className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container border-2 border-outline/60 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">
                restaurant
              </span>
            </span>
          </div>
          <p className="font-display-lg text-xl sm:text-2xl font-extrabold tracking-tight leading-tight tabular-nums">
            {formatRupiah(essentialRemaining)}{" "}
            <span className="text-xs font-medium text-on-surface-variant">/ hari</span>
          </p>
          <p className="text-xs font-body-md text-on-surface-variant leading-snug">
            Makan, Minum, Bensin & Dapur
            {essentialDailySpending > 0 &&
              ` • Terpakai ${formatRupiah(essentialDailySpending)}`}
          </p>
        </div>

        {/* Kolom Kanan (3 kolom): Sisa Kuota Sekunder Harian */}
        <div className="lg:col-span-3 bg-secondary-container/15 dark:bg-secondary-container/15 text-on-surface rounded-xl border-2 border-outline/40 p-4 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="font-label-bold font-bold text-xs uppercase tracking-wide text-on-surface-variant">
              Sisa Kuota Sekunder
            </span>
            <span className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container border-2 border-outline/60 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">
                local_cafe
              </span>
            </span>
          </div>
          <p className="font-display-lg text-xl sm:text-2xl font-extrabold tracking-tight leading-tight tabular-nums">
            {formatRupiah(discretionaryRemaining)}{" "}
            <span className="text-xs font-medium text-on-surface-variant">/ hari</span>
          </p>
          <p className="text-xs font-body-md text-on-surface-variant leading-snug">
            Nongkrong, Kopi & Hiburan Bebas
            {discretionaryDailySpending > 0 &&
              ` • Terpakai ${formatRupiah(discretionaryDailySpending)}`}
          </p>
        </div>
      </div>
    </section>
  );
}
