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

  const { remainingDays, dailyBudget, budgetCycle } = budget;
  const isOverBudget = dailyCheck?.isOverBudget ?? false;
  const overAmount = dailyCheck?.overAmount ?? 0;
  const eligibleDailySpending = dailyCheck?.eligibleDailySpending ?? 0;

  const dailyRemainingBalance = Math.max(0, dailyBudget - eligibleDailySpending);
  const dailyProgressPercent =
    dailyBudget > 0 ? Math.min(100, (eligibleDailySpending / dailyBudget) * 100) : 0;

  return (
    <motion.section
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="col-span-12 bg-surface-container border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] rounded-3xl overflow-hidden flex flex-col"
    >
      {/* Header */}
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

        <div className="flex items-center gap-2">
          {budgetCycle?.isPaydayCycle && (
            <span className="hidden sm:inline-flex items-center h-8 px-3 bg-surface border-2 border-outline rounded-full text-on-surface font-label-bold text-xs uppercase">
              {budgetCycle.label}
            </span>
          )}
          <Link
            href="/budget"
            className="h-8 px-3.5 inline-flex items-center gap-1.5 bg-surface-container hover:bg-surface-bright border-2 border-outline rounded-full text-on-surface font-label-bold text-xs uppercase active-press shadow-[1px_1px_0_0_var(--theme-outline)]"
          >
            <span>Buka Anggaran</span>
            <span className="material-symbols-outlined text-sm leading-none">arrow_forward</span>
          </Link>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Peringatan Over-Budget Harian */}
        {isOverBudget ? (
          <div className="bg-error-container border-3 border-outline rounded-2xl p-4 shadow-[3px_3px_0_0_var(--theme-outline)] text-on-error-container space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error font-bold text-xl">
                warning
              </span>
              <h4 className="font-label-bold uppercase text-sm tracking-wide">
                Melewati Batas Kuota Hari Ini
              </h4>
            </div>
            <p className="font-body-md text-xs">
              Pengeluaran harian mencapai{" "}
              <strong className="font-bold underline">
                {formatRupiah(eligibleDailySpending)}
              </strong>
              , melebihi kuota harian sebesar{" "}
              <strong className="font-bold text-error">
                {formatRupiah(overAmount)}
              </strong>
              .
            </p>
            <p className="font-label-md text-[10px] opacity-80">
              Catatan: Cicilan hutang dan tagihan bulanan (kos, listrik, dll) tidak dihitung dalam kuota ini.
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border-2 border-outline p-4 shadow-[2px_2px_0_0_var(--theme-outline)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="font-label-bold text-xs uppercase text-on-surface-variant block mb-1">
                Sisa Kuota Belanja Hari Ini
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-display-lg text-primary tracking-tight">
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
              <div className="flex justify-between text-xs font-label-bold text-on-surface">
                <span>Terpakai Hari Ini</span>
                <span>{formatRupiah(eligibleDailySpending)}</span>
              </div>
              <div className="h-3.5 w-full bg-surface-container-high border-2 border-outline rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dailyProgressPercent}%` }}
                  transition={{ duration: 0.6, type: "spring" }}
                  className="h-full bg-primary border-r-2 border-outline"
                />
              </div>
              <p className="text-[10px] text-right text-on-surface-variant font-label-md">
                Tersisa {remainingDays} hari • Sisa dana {formatRupiah(budget.fundsForDaily)}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
