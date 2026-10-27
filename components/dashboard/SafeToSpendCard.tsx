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
      className="col-span-12 bg-surface-container border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] rounded-3xl overflow-hidden flex flex-col"
    >
      <div className="bg-primary-container border-b-[3px] border-outline px-6 py-3.5 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-surface border-2 border-outline flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">
              savings
            </span>
          </div>
          <div>
            <h3
              className="font-headline-md text-lg text-on-primary-container uppercase font-bold tracking-tight"
              style={{ WebkitTextStroke: "0.5px var(--theme-outline)" }}
            >
              Batas Belanja Hari Ini
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {budgetCycle?.isPaydayCycle && (
            <>
              <span className="inline-flex items-center h-7 sm:h-8 px-2.5 sm:px-3 text-[10px] sm:text-xs font-label-bold uppercase bg-tertiary-container text-on-tertiary-container rounded-full border-2 border-outline shadow-[1px_1px_0_0_var(--theme-outline)]">
                Siklus Gajian
              </span>
              <span className="inline-flex items-center h-7 sm:h-8 px-2.5 sm:px-3 bg-surface border-2 border-outline rounded-full text-on-surface font-label-bold text-[10px] sm:text-xs uppercase">
                {budgetCycle.label}
              </span>
            </>
          )}
          <Link
            href="/budget"
            className="h-7 sm:h-8 px-3 sm:px-3.5 inline-flex items-center gap-1.5 bg-surface-container hover:bg-surface-bright border-2 border-outline rounded-full text-on-surface font-label-bold text-[10px] sm:text-xs uppercase active-press shadow-[1px_1px_0_0_var(--theme-outline)]"
          >
            <span>Buka Anggaran</span>
            <span className="material-symbols-outlined text-xs sm:text-sm leading-none">arrow_forward</span>
          </Link>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {isOverBudget ? (
          <div className="bg-error-container border-3 border-outline rounded-2xl p-4 shadow-[3px_3px_0_0_var(--theme-outline)] text-on-error-container space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error font-bold text-xl">
                  warning
                </span>
                <h4 className="font-label-bold uppercase text-sm tracking-wide">
                  Melewati Batas Kuota Hari Ini
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-error text-on-error border-2 border-outline shadow-[1px_1px_0_0_var(--theme-outline)]">
                {percentUsed}% Terpakai
              </span>
            </div>
            <p className="font-body-md text-xs">
              Pengeluaran harian mencapai{" "}
              <strong className="font-bold underline">
                {formatRupiah(eligibleDailySpending)}
              </strong>{" "}
              ({percentUsed}% dari kuota {formatRupiah(dailyBudget)}/hari), melebihi kuota harian sebesar{" "}
              <strong className="font-bold text-error">
                {formatRupiah(overAmount)}
              </strong>
              .
            </p>
            <div className="h-3 w-full bg-surface/60 border-2 border-outline rounded-full overflow-hidden relative">
              <div className="h-full bg-error border-r-2 border-outline w-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="bg-surface/80 rounded-xl border border-outline p-2 text-on-surface">
                <span className="font-label-bold block uppercase text-[9px] text-on-surface-variant">
                  Pokok (Makan/BBM)
                </span>
                <span className="font-bold">
                  {formatRupiah(essentialDailySpending)} / {formatRupiah(dailyEssentialBudget)}
                </span>
                {dailyCheck?.isOverEssentialBudget && (
                  <span className="text-[9px] font-bold text-error block">Lewat kuota pokok</span>
                )}
              </div>
              <div className="bg-surface/80 rounded-xl border border-outline p-2 text-on-surface">
                <span className="font-label-bold block uppercase text-[9px] text-on-surface-variant">
                  Sekunder (Jajan/Gaya Hidup)
                </span>
                <span className="font-bold">
                  {formatRupiah(discretionaryDailySpending)} / {formatRupiah(dailyDiscretionaryBudget)}
                </span>
                {dailyCheck?.isOverDiscretionaryBudget && (
                  <span className="text-[9px] font-bold text-error block">Lewat kuota sekunder</span>
                )}
              </div>
            </div>
            <p className="font-label-md text-[10px] opacity-80">
              Catatan: Cicilan hutang dan tagihan bulanan (kos, listrik, dll) tidak dihitung dalam kuota ini.
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border-2 border-outline p-4 shadow-[2px_2px_0_0_var(--theme-outline)] flex flex-col space-y-3.5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="font-label-bold text-xs uppercase text-on-surface-variant block mb-1">
                  Sisa Kuota Belanja Hari Ini (Total)
                </span>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5">
                  <span className="text-2xl sm:text-3xl font-display-lg text-primary tracking-tight">
                    {formatRupiah(dailyRemainingBalance)}
                  </span>
                  <span className="text-xs font-label-bold text-on-surface-variant uppercase">
                    tersisa dari kuota {formatRupiah(dailyBudget)}/hari
                  </span>
                </div>
                {dailyCheck && dailyCheck.excludedCount > 0 && (
                  <p className="text-[11px] text-tertiary dark:text-tertiary-fixed font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>{dailyCheck.excludedCount} tagihan bulanan/cicilan hari ini dikecualikan</span>
                  </p>
                )}
              </div>

              <div className="w-full md:w-64 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-label-bold text-on-surface">
                  <div className="flex items-center gap-1.5">
                    <span>Terpakai Hari Ini</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold uppercase border ${
                      percentUsed >= 80
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                        : "bg-primary/10 text-primary border-primary/20"
                    }`}>
                      {percentUsed}%
                    </span>
                  </div>
                  <span>{formatRupiah(eligibleDailySpending)}</span>
                </div>
                <div className="h-3.5 w-full bg-surface-container-high border-2 border-outline rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dailyProgressPercent}%` }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className={`h-full border-r-2 border-outline ${
                      percentUsed >= 80 ? "bg-amber-500" : "bg-primary"
                    }`}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-label-md">
                  {percentUsed >= 80 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">warning</span>
                      Mendekati batas kuota
                    </span>
                  ) : (
                    <span></span>
                  )}
                  <span className="text-right">
                    Tersisa {remainingDays} hari (termasuk hari ini) • Sisa dana {formatRupiah(budget.fundsForDaily)}
                    {(budget.cumulativeSavings ?? 0) > 0 && ` • Tabungan ${formatRupiah(budget.cumulativeSavings || 0)}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 border-t border-outline/30">
              <div className="bg-surface-container rounded-xl border-2 border-outline p-3 shadow-[1px_1px_0_0_var(--theme-outline)] flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="font-label-bold text-[11px] uppercase text-on-surface truncate">
                      Batas Pokok
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-label-md truncate shrink-0">
                    {dailyEssentialBudget > 0 ? `Kuota ${formatRupiah(dailyEssentialBudget)}/hari` : "Tanpa kuota (Rp 0)"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-outline/20">
                  <div>
                    <span className="text-[10px] font-label-bold uppercase text-on-surface-variant block">
                      Terpakai
                    </span>
                    <span className={`font-display-lg text-sm sm:text-base font-bold block ${
                      dailyCheck?.isOverEssentialBudget ? "text-error" : "text-on-surface"
                    }`}>
                      {formatRupiah(essentialDailySpending)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-label-bold uppercase text-on-surface-variant block">
                      Sisa Kuota
                    </span>
                    <span className="font-display-lg text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 block">
                      {formatRupiah(essentialRemaining)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container rounded-xl border-2 border-outline p-3 shadow-[1px_1px_0_0_var(--theme-outline)] flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                    <span className="font-label-bold text-[11px] uppercase text-on-surface truncate">
                      Batas Sekunder
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-label-md truncate shrink-0">
                    {dailyDiscretionaryBudget > 0 ? `Kuota ${formatRupiah(dailyDiscretionaryBudget)}/hari` : "Tanpa kuota (Rp 0)"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-outline/20">
                  <div>
                    <span className="text-[10px] font-label-bold uppercase text-on-surface-variant block">
                      Terpakai
                    </span>
                    <span className={`font-display-lg text-sm sm:text-base font-bold block ${
                      dailyCheck?.isOverDiscretionaryBudget ? "text-error" : "text-on-surface"
                    }`}>
                      {formatRupiah(discretionaryDailySpending)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-label-bold uppercase text-on-surface-variant block">
                      Sisa Kuota
                    </span>
                    <span className="font-display-lg text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400 block">
                      {formatRupiah(discretionaryRemaining)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
