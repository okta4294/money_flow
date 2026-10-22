"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatRupiah } from "@/lib/utils";
import {
  BudgetRecommendationResult,
  DailyLimitCheckResult,
} from "@/lib/budget-calculator";

interface BudgetCardProps {
  budget: BudgetRecommendationResult | null;
  dailyCheck: DailyLimitCheckResult | null;
  loading: boolean;
  month: number;
  year: number;
}

export function BudgetCard({
  budget,
  dailyCheck,
  loading,
  month,
  year,
}: BudgetCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (loading || !budget) {
    return (
      <div className="col-span-12 bg-surface-container border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] p-6 rounded-3xl animate-pulse space-y-4">
        <div className="h-6 w-48 bg-surface-bright rounded"></div>
        <div className="h-20 w-full bg-surface-bright rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-16 bg-surface-bright rounded-xl"></div>
          <div className="h-16 bg-surface-bright rounded-xl"></div>
          <div className="h-16 bg-surface-bright rounded-xl"></div>
        </div>
      </div>
    );
  }

  const {
    eligibleIncome,
    debtObligations,
    totalDebtObligation,
    incomeAfterDebt,
    isDebtDeficit,
    categoryAllocations,
    fundsForDaily,
    remainingDays,
    dailyBudget,
    warnings,
  } = budget;

  const isOverBudget = dailyCheck?.isOverBudget ?? false;
  const overAmount = dailyCheck?.overAmount ?? 0;
  const eligibleDailySpending = dailyCheck?.eligibleDailySpending ?? 0;
  const essentialDailySpending = dailyCheck?.essentialDailySpending ?? 0;
  const discretionaryDailySpending = dailyCheck?.discretionaryDailySpending ?? 0;
  const dailyEssentialBudget = budget.dailyEssentialBudget;
  const dailyDiscretionaryBudget = budget.dailyDiscretionaryBudget;

  const essentialRemaining = Math.max(0, dailyEssentialBudget - essentialDailySpending);
  const discretionaryRemaining = Math.max(0, dailyDiscretionaryBudget - discretionaryDailySpending);

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
      <div className="bg-primary-container border-b-[3px] border-outline px-6 py-4 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface border-2 border-outline flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl">
              calculate
            </span>
          </div>
          <div>
            <h3
              className="font-headline-md text-xl text-on-primary-container uppercase font-bold tracking-tight"
              style={{ WebkitTextStroke: "0.5px var(--theme-outline)" }}
            >
              Rencana Anggaran & Batas Harian
            </h3>
            <p className="font-label-md text-xs text-on-primary-container/80">
              Kalkulasi otomatis berbasis tenor hutang dan riwayat kebiasaan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {budget.budgetCycle?.isPaydayCycle && (
            <span className="hidden sm:inline-flex items-center h-8 px-3 text-xs font-label-bold uppercase bg-tertiary-container text-on-tertiary-container rounded-full border-2 border-outline shadow-[1px_1px_0_0_var(--theme-outline)]">
              Siklus Gajian
            </span>
          )}
          <span className="h-8 px-3 inline-flex items-center font-label-bold text-xs uppercase bg-surface border-2 border-outline rounded-full text-on-surface">
            {budget.budgetCycle?.isPaydayCycle ? budget.budgetCycle.label : `${month}/${year}`}
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="h-8 px-3.5 inline-flex items-center gap-1.5 font-label-bold text-xs uppercase bg-surface-container hover:bg-surface-bright border-2 border-outline rounded-full text-on-surface active-press shadow-[1px_1px_0_0_var(--theme-outline)]"
          >
            <span>{showDetails ? "Tutup Rincian" : "Lihat Rincian"}</span>
            <span className="material-symbols-outlined text-sm leading-none">
              {showDetails ? "expand_less" : "expand_more"}
            </span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Peringatan Over-Budget Harian */}
        {isOverBudget ? (
          <div className="bg-error-container border-3 border-outline rounded-2xl p-5 shadow-[3px_3px_0_0_var(--theme-outline)] text-on-error-container space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error font-bold text-2xl">
                warning
              </span>
              <h4 className="font-label-bold uppercase text-base tracking-wide">
                Peringatan: Melewati Batas Pengeluaran Hari Ini
              </h4>
            </div>
            <p className="font-body-md text-sm">
              Pengeluaran harian Anda hari ini sudah mencapai{" "}
              <strong className="font-bold underline">
                {formatRupiah(eligibleDailySpending)}
              </strong>
              , melebihi rekomendasi harian sebesar{" "}
              <strong className="font-bold text-error">
                {formatRupiah(overAmount)}
              </strong>
              .
            </p>
            {/* Rincian Status Pokok vs Sekunder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="bg-surface/80 rounded-xl border border-outline p-2.5 text-on-surface text-xs">
                <span className="font-label-bold block uppercase text-[10px] text-on-surface-variant">
                  Kebutuhan Pokok (Makan/BBM)
                </span>
                <span className="font-bold text-sm">
                  {formatRupiah(essentialDailySpending)} / {formatRupiah(dailyEssentialBudget)}
                </span>
                {dailyCheck?.isOverEssentialBudget && (
                  <span className="text-[10px] font-bold text-error block">Lewat kuota pokok</span>
                )}
              </div>
              <div className="bg-surface/80 rounded-xl border border-outline p-2.5 text-on-surface text-xs">
                <span className="font-label-bold block uppercase text-[10px] text-on-surface-variant">
                  Kebutuhan Sekunder (Jajan/Hiburan)
                </span>
                <span className="font-bold text-sm">
                  {formatRupiah(discretionaryDailySpending)} / {formatRupiah(dailyDiscretionaryBudget)}
                </span>
                {dailyCheck?.isOverDiscretionaryBudget && (
                  <span className="text-[10px] font-bold text-error block">Lewat kuota sekunder</span>
                )}
              </div>
            </div>
            <p className="font-label-md text-[11px] opacity-80">
              Catatan: Pembayaran cicilan hutang dan tagihan tetap bulanan (kos, listrik, dll) tidak dihitung dalam batas harian ini.
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border-2 border-outline p-5 shadow-[2px_2px_0_0_var(--theme-outline)] flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="font-label-bold text-xs uppercase text-on-surface-variant block mb-1">
                  Batas Belanja Hari Ini (Total)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display-lg text-primary tracking-tight">
                    {formatRupiah(dailyRemainingBalance)}
                  </span>
                  <span className="text-xs font-label-bold text-on-surface-variant uppercase">
                    tersisa dari kuota {formatRupiah(dailyBudget)}/hari
                  </span>
                </div>
                {dailyCheck && dailyCheck.excludedCount > 0 && (
                  <p className="text-[11px] text-tertiary dark:text-tertiary-fixed font-bold mt-1.5 flex items-center gap-1">
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
                <div className="h-4 w-full bg-surface-container-high border-2 border-outline rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dailyProgressPercent}%` }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className="h-full bg-primary border-r-2 border-outline"
                  />
                </div>
                <p className="text-[10px] text-right text-on-surface-variant font-label-md">
                  Tersisa {remainingDays} hari di siklus ini
                </p>
              </div>
            </div>

            {/* Sub-kuota bertingkat: Pokok & Sekunder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-outline/30">
              <div className="bg-surface-container rounded-xl border-2 border-outline p-3 shadow-[1px_1px_0_0_var(--theme-outline)] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-label-bold text-xs uppercase text-on-surface">
                      Batas Pokok Harian
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 font-label-md">
                    Makan, bbm, kebutuhan harian
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display-lg text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
                    {formatRupiah(essentialRemaining)}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-label-bold uppercase">
                    dari {formatRupiah(dailyEssentialBudget)}/hari
                  </span>
                </div>
              </div>

              <div className="bg-surface-container rounded-xl border-2 border-outline p-3 shadow-[1px_1px_0_0_var(--theme-outline)] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span className="font-label-bold text-xs uppercase text-on-surface">
                      Batas Sekunder Harian
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 font-label-md">
                    Jajan, hiburan, gaya hidup
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display-lg text-sm font-bold text-indigo-600 dark:text-indigo-400 block">
                    {formatRupiah(discretionaryRemaining)}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-label-bold uppercase">
                    dari {formatRupiah(dailyDiscretionaryBudget)}/hari
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Warnings (Overdue, Deficit, etc) */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((w) => {
              const isCrit = w.severity === "critical";
              const isWarn = w.severity === "warning";
              const bgClass = isCrit
                ? "bg-error-container text-on-error-container"
                : isWarn
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-surface-container-high text-on-surface";

              return (
                <div
                  key={w.id}
                  className={`border-2 border-outline rounded-xl p-3 text-xs flex items-start gap-2.5 shadow-[2px_2px_0_0_var(--theme-outline)] ${bgClass}`}
                >
                  <span className="material-symbols-outlined text-base mt-0.5 shrink-0">
                    {isCrit ? "error" : isWarn ? "warning" : "info"}
                  </span>
                  <div>
                    <strong className="font-label-bold uppercase block tracking-wider">
                      {w.title}
                    </strong>
                    <span className="font-body-sm opacity-90">
                      {w.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3 Pipeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tahap 1: Pemasukan Utama */}
          <div className="bg-surface rounded-2xl border-2 border-outline p-4 shadow-[2px_2px_0_0_var(--theme-outline)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-label-bold text-xs uppercase text-on-surface-variant">
                    1. Pemasukan Utama
                  </span>
                  {budget.isIncomeEstimated && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-secondary text-on-secondary rounded-sm">
                      Proyeksi Historis
                    </span>
                  )}
                </div>
                <span className="material-symbols-outlined text-tertiary text-lg">
                  payments
                </span>
              </div>
              <h4 className="text-xl md:text-2xl font-display-lg text-tertiary dark:text-tertiary-fixed">
                {formatRupiah(eligibleIncome)}
              </h4>
            </div>
            <p className="font-label-md text-[11px] text-on-surface-variant mt-2">
              {budget.isIncomeEstimated
                ? `Akumulasi siklus ini masih berjalan. Menggunakan proyeksi acuan ${budget.estimatedIncomeMonth || "siklus lalu"}.`
                : "Kategori rutin (Gaji, Uang Saku, atau Uang Bulanan) sebagai dasar budget."}
            </p>
          </div>

          {/* Tahap 2: Beban Hutang Tenor */}
          <div className="bg-surface rounded-2xl border-2 border-outline p-4 shadow-[2px_2px_0_0_var(--theme-outline)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-bold text-xs uppercase text-on-surface-variant">
                  2. Cicilan Hutang Siklus Ini
                </span>
                <span className="material-symbols-outlined text-error text-lg">
                  account_balance
                </span>
              </div>
              <h4 className="text-xl md:text-2xl font-display-lg text-error">
                {formatRupiah(totalDebtObligation)}
              </h4>
              {budget.paidDebtInCycle > 0 && (
                <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-tertiary dark:text-tertiary-fixed">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>{formatRupiah(budget.paidDebtInCycle)} terbayar di muka</span>
                </div>
              )}
            </div>
            <p className="font-label-md text-[11px] text-on-surface-variant mt-2">
              Dihitung dari cicilan jatuh tempo dan pembayaran di muka dalam siklus ini
            </p>
          </div>

          {/* Tahap 3: Sisa Safe-to-Spend */}
          <div className="bg-surface rounded-2xl border-2 border-outline p-4 shadow-[2px_2px_0_0_var(--theme-outline)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-bold text-xs uppercase text-on-surface-variant">
                  3. Dana Harian Bebas
                </span>
                <span className="material-symbols-outlined text-primary text-lg">
                  savings
                </span>
              </div>
              <h4 className="text-xl md:text-2xl font-display-lg text-primary">
                {formatRupiah(fundsForDaily)}
              </h4>
              <div className="mt-2 space-y-1 text-[11px] font-label-md">
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Alokasi Pokok:
                  </span>
                  <strong className="text-on-surface">{formatRupiah(budget.remainingEssentialFunds)}</strong>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    Alokasi Sekunder:
                  </span>
                  <strong className="text-on-surface">{formatRupiah(budget.remainingDiscretionaryFunds)}</strong>
                </div>
              </div>
              {budget.pastDailyExpensesInCycle > 0 && (
                <p className="text-[10px] text-on-surface-variant mt-2 font-bold">
                  Terpakai {formatRupiah(budget.pastDailyExpensesInCycle)} sebelum hari ini
                </p>
              )}
            </div>
            <p className="font-label-md text-[11px] text-on-surface-variant mt-2">
              Sisa dana siap pakai untuk {remainingDays} hari ({formatRupiah(dailyBudget)}/hari)
            </p>
          </div>
        </div>

        {/* Collapsible Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 pt-4 border-t-2 border-outline border-dashed overflow-hidden"
            >
              {/* Detail Hutang Berdasarkan Tenor */}
              <div>
                <h4 className="font-label-bold text-xs uppercase tracking-widest text-on-surface mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">
                    checklist
                  </span>
                  Rincian Kewajiban Hutang Berdasarkan Tenor
                </h4>

                {debtObligations.length === 0 && (budget.paidDebtInCycle ?? 0) === 0 ? (
                  <p className="text-xs font-body-md text-on-surface-variant p-3 bg-surface rounded-xl border-2 border-outline">
                    Tidak ada kewajiban cicilan di siklus ini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {budget.paidDebtInCycle > 0 && (
                      <div className="bg-surface rounded-xl border-2 border-outline p-3 flex flex-wrap items-center justify-between gap-2 shadow-[2px_2px_0_0_var(--theme-outline)]">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-label-bold text-sm text-on-surface">
                              Pelunasan Cicilan di Muka
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-tertiary text-on-tertiary rounded-sm">
                              Sudah Dibayar
                            </span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant font-label-md">
                            Pembayaran hutang yang telah direalisasikan di dalam siklus ini
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-label-bold text-on-surface-variant block">
                            Telah Terpotong
                          </span>
                          <span className="text-base font-display-lg font-bold text-tertiary dark:text-tertiary-fixed">
                            {formatRupiah(budget.paidDebtInCycle)}
                          </span>
                        </div>
                      </div>
                    )}

                    {debtObligations.map((d) => (
                      <div
                        key={d.debtId}
                        className="bg-surface rounded-xl border-2 border-outline p-3 flex flex-wrap items-center justify-between gap-2 shadow-[2px_2px_0_0_var(--theme-outline)]"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-label-bold text-sm text-on-surface">
                              {d.debtName}
                            </span>
                            {d.isOverdue && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-error text-on-error rounded-sm">
                                Lewat Jatuh Tempo
                              </span>
                            )}
                            {d.isUrgent && !d.isOverdue && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-secondary text-on-secondary rounded-sm">
                                Jatuh Tempo Siklus Ini
                              </span>
                            )}
                            {d.isUpcoming && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-surface-container border border-outline text-on-surface-variant rounded-sm">
                                Tagihan Mendatang ({d.dueDate?.substring(0, 7)})
                              </span>
                            )}
                            {d.hasNoDueDate && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-surface-container-high text-on-surface rounded-sm">
                                Tanpa Tenor
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-on-surface-variant font-label-md">
                            Total sisa: {formatRupiah(d.remainingAmount)}
                            {d.dueDate ? ` • Jatuh tempo: ${d.dueDate}` : ""}
                            {d.isUpcoming ? ` • Bukan beban siklus ini` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-label-bold text-on-surface-variant block">
                            Beban Siklus Ini
                          </span>
                          <span className={`text-base font-display-lg font-bold ${
                            d.monthlyObligation > 0 ? "text-error" : "text-on-surface-variant"
                          }`}>
                            {formatRupiah(d.monthlyObligation)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rekomendasi Budget per Kategori Pengeluaran */}
              <div>
                <h4 className="font-label-bold text-xs uppercase tracking-widest text-on-surface mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">
                    pie_chart
                  </span>
                  Rekomendasi Alokasi Pengeluaran per Kategori
                </h4>

                {categoryAllocations.length === 0 ? (
                  <p className="text-xs font-body-md text-on-surface-variant p-3 bg-surface rounded-xl border-2 border-outline">
                    Belum ada kategori pengeluaran yang terdaftar.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryAllocations.map((cat) => {
                      const maxCompare = Math.max(
                        cat.recommendedBudget,
                        cat.currentMonthSpent,
                        1
                      );
                      const spentRatio = Math.min(
                        100,
                        (cat.currentMonthSpent / maxCompare) * 100
                      );
                      const isOverCategory =
                        cat.recommendedBudget > 0 &&
                        cat.currentMonthSpent > cat.recommendedBudget;

                      return (
                        <div
                          key={cat.categoryId}
                          className="bg-surface rounded-xl border-2 border-outline p-3 space-y-2 shadow-[2px_2px_0_0_var(--theme-outline)]"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-label-bold text-sm text-on-surface truncate">
                                  {cat.categoryName}
                                </span>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm border border-outline ${
                                  cat.isFixed
                                    ? "bg-amber-400 text-slate-950 dark:bg-amber-300"
                                    : cat.isEssential
                                    ? "bg-emerald-500 text-white dark:bg-emerald-400 dark:text-slate-950"
                                    : "bg-indigo-500 text-white dark:bg-indigo-400 dark:text-slate-950"
                                }`}>
                                  {cat.isFixed ? "Tetap" : cat.isEssential ? "Pokok" : "Sekunder"}
                                </span>
                              </div>
                              <p className="text-[10px] text-on-surface-variant font-label-md flex items-center gap-1.5 flex-wrap">
                                <span>Historis: {formatRupiah(cat.historicalAvg)}/bln</span>
                                {typeof cat.weightPercent === "number" && cat.weightPercent > 0 && !cat.isFixed && (
                                  <span className="font-bold text-primary dark:text-primary-fixed">
                                    • Bobot {cat.weightPercent}%
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-label-bold text-on-surface-variant block">
                                Target Anggaran
                              </span>
                              <span className="text-sm font-display-lg font-bold text-primary">
                                {formatRupiah(cat.recommendedBudget)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-label-bold">
                              <span className="text-on-surface-variant">
                                Terpakai: {formatRupiah(cat.currentMonthSpent)}
                              </span>
                              {isOverCategory && (
                                <span className="text-error font-bold">
                                  Melebihi target
                                </span>
                              )}
                            </div>
                            <div className="h-2.5 w-full bg-surface-container border border-outline rounded-full overflow-hidden">
                              <div
                                style={{ width: `${spentRatio}%` }}
                                className={`h-full transition-all duration-300 ${
                                  isOverCategory
                                    ? "bg-error"
                                    : "bg-tertiary"
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
