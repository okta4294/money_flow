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
  const [showInfoNotes, setShowInfoNotes] = useState(false);

  if (loading || !budget) {
    return (
      <div className="col-span-12 bg-surface-container comic-card p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-surface-bright rounded"></div>
        <div className="h-20 w-full bg-surface-bright rounded-xl"></div>
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
    warnings = [],
  } = budget;

  const actionAlerts = warnings.filter(
    (w) => w.severity === "critical" || w.severity === "warning"
  );
  const infoNotes = warnings.filter((w) => w.severity === "info");

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
  const percentUsed =
    dailyBudget > 0
      ? Math.round((eligibleDailySpending / dailyBudget) * 100)
      : eligibleDailySpending > 0
      ? 100
      : 0;
  const dailyProgressPercent = Math.min(100, percentUsed);

  const fixedCategories = categoryAllocations.filter((c) => c.isFixed);
  const essentialCategories = categoryAllocations.filter(
    (c) => !c.isFixed && c.isEssential
  );
  const discretionaryCategories = categoryAllocations.filter(
    (c) => !c.isFixed && !c.isEssential
  );

  const useCleanBalance = budget.currentBalance !== undefined;
  const fixedBudgetTotal = fixedCategories.reduce(
    (sum, c) => sum + c.recommendedBudget,
    0
  );
  const pillar1Total = totalDebtObligation + fixedBudgetTotal;
  const pillar2RecommendedTotal = essentialCategories.reduce(
    (sum, c) => sum + c.recommendedBudget,
    0
  );
  const pillar2RemainingTotal = essentialCategories.reduce(
    (sum, c) =>
      sum +
      (c.remainingBudget ?? Math.max(0, c.recommendedBudget - c.currentMonthSpent)),
    0
  );
  const pillar2Total = useCleanBalance
    ? pillar2RemainingTotal
    : pillar2RecommendedTotal;

  const pillar3RecommendedTotal = discretionaryCategories.reduce(
    (sum, c) => sum + c.recommendedBudget,
    0
  );
  const pillar3RemainingTotal = discretionaryCategories.reduce(
    (sum, c) =>
      sum +
      (c.remainingBudget ?? Math.max(0, c.recommendedBudget - c.currentMonthSpent)),
    0
  );
  const pillar3Total = useCleanBalance
    ? pillar3RemainingTotal
    : pillar3RecommendedTotal;

  return (
    <div className="col-span-12 space-y-6">
      {/* 3 Kartu Pilar Anggaran Sejajar sesuai FigCraft Frame 02 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* PILAR 1: HUTANG JATUH TEMPO & POS TETAP (100%) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="min-w-0 bg-surface comic-card p-5 flex flex-col gap-4"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-error-container text-on-error-container border-2 border-outline font-label-bold font-bold text-xs mb-2.5 sketch-hatch">
              <span className="material-symbols-outlined text-sm">
                priority_high
              </span>
              <span>1. Hutang & Pos Tetap (100%)</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-display-lg font-extrabold text-on-surface tracking-tight tabular-nums">
              {formatRupiah(pillar1Total)}
            </h2>
            <p className="text-xs font-body-sm text-on-surface-variant mt-0.5">
              Wajib lunas 100% di siklus berjalan &bull; Dikecualikan dari kuota harian
            </p>
          </div>

          <div className="space-y-2.5 flex-1">
            {/* Pelunasan Hutang di Muka (Early Debt Payment) */}
            {budget.paidDebtInCycle > 0 && (
              <div className="bg-background border-2 border-outline/40 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-bold text-xs sm:text-sm text-on-surface font-bold tabular-nums">
                    Pelunasan Cicilan di Muka &bull;{" "}
                    {formatRupiah(budget.paidDebtInCycle)}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-surface-container-high border border-outline/60 rounded-md overflow-hidden">
                  <div className="h-full w-full bg-tertiary-container sketch-hatch" />
                </div>
                <p className="text-xs font-label-bold font-semibold text-tertiary dark:text-tertiary-fixed">
                  Early Debt Payment: Otomatis menyerap dana siklus berjalan
                </p>
              </div>
            )}

            {/* Daftar Kewajiban Hutang Jatuh Tempo */}
            {debtObligations
              .filter((d) => !d.isUpcoming)
              .map((d) => (
                <div
                  key={d.debtId}
                  className="bg-background border-2 border-outline/40 rounded-xl p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label-bold text-xs sm:text-sm text-on-surface font-bold truncate tabular-nums">
                      {d.debtName}
                      {d.dueDate ? ` (Jatuh Tempo ${d.dueDate})` : ""} &bull;{" "}
                      {formatRupiah(d.monthlyObligation)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-surface-container-high border border-outline/60 rounded-md overflow-hidden">
                    <div
                      className={`h-full sketch-hatch ${
                        d.isOverdue ? "bg-error-container w-full" : "bg-primary-container w-1/2"
                      }`}
                    />
                  </div>
                  <p className="text-xs font-body-sm text-on-surface-variant">
                    {d.isOverdue
                      ? "Lewat jatuh tempo: Wajib segera dilunasi di siklus ini"
                      : "Prioritas cicilan jatuh tempo di siklus berjalan"}
                  </p>
                </div>
              ))}

            {/* Daftar Pos Pengeluaran Tetap */}
            {fixedCategories.map((cat) => {
              const maxVal = Math.max(cat.recommendedBudget, cat.currentMonthSpent, 1);
              const pct = Math.min(100, (cat.currentMonthSpent / maxVal) * 100);
              const isPaidFixed =
                cat.recommendedBudget > 0 &&
                cat.currentMonthSpent >= cat.recommendedBudget;

              return (
                <div
                  key={cat.categoryId}
                  className="bg-background border-2 border-outline/40 rounded-xl p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label-bold text-xs sm:text-sm text-on-surface font-bold truncate tabular-nums">
                      {cat.categoryName} &bull;{" "}
                      {formatRupiah(cat.recommendedBudget)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-surface-container-high border border-outline/60 rounded-md overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full sketch-hatch ${
                        isPaidFixed ? "bg-tertiary-container" : "bg-error-container"
                      }`}
                    />
                  </div>
                  <p
                    className={`text-xs font-label-bold tabular-nums ${
                      isPaidFixed
                        ? "text-tertiary dark:text-tertiary-fixed font-semibold"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {isPaidFixed
                      ? "Status: Sudah Terbayar di Siklus Ini"
                      : `Terpakai ${formatRupiah(cat.currentMonthSpent)} • Sisa ${formatRupiah(
                          Math.max(0, cat.recommendedBudget - cat.currentMonthSpent)
                        )}`}
                  </p>
                </div>
              );
            })}

            {fixedCategories.length === 0 &&
              debtObligations.filter((d) => !d.isUpcoming).length === 0 &&
              (budget.paidDebtInCycle ?? 0) === 0 && (
                <div className="bg-background border-2 border-dashed border-outline/60 rounded-xl p-4 text-center text-xs text-on-surface-variant sketch-hatch">
                  Tidak ada cicilan jatuh tempo atau pos tetap di siklus ini.
                </div>
              )}
          </div>
        </motion.div>

        {/* PILAR 2: POS KEBUTUHAN POKOK (BOBOT 4 BULAN) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="min-w-0 bg-surface comic-card p-5 flex flex-col gap-4"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary-container text-on-primary-container border-2 border-outline font-label-bold font-bold text-xs mb-2.5 sketch-hatch">
              <span className="material-symbols-outlined text-sm">
                restaurant
              </span>
              <span>2. Pos Pokok (Bobot 4 Bln)</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-display-lg font-extrabold text-on-surface tracking-tight tabular-nums">
              {formatRupiah(pillar2Total)}
            </h2>
            <p className="text-xs font-body-sm text-on-surface-variant mt-0.5 tabular-nums">
              {useCleanBalance && pillar2RecommendedTotal !== pillar2Total
                ? `Sisa dari jatah ${formatRupiah(pillar2RecommendedTotal)}`
                : "Sesuai rasio pengeluaran 4 bulan"}{" "}
              &bull; Kuota {formatRupiah(dailyEssentialBudget)}/hari
            </p>
          </div>

          <div className="space-y-2.5 flex-1">
            {essentialCategories.length === 0 ? (
              <div className="bg-background border-2 border-dashed border-outline/60 rounded-xl p-4 text-center text-xs text-on-surface-variant sketch-hatch">
                Belum ada kategori Pos Pokok (Makan, BBM, Sembako, Dapur).
              </div>
            ) : (
              essentialCategories.map((cat) => {
                const maxVal = Math.max(
                  cat.recommendedBudget,
                  cat.currentMonthSpent,
                  1
                );
                const pct = Math.min(
                  100,
                  (cat.currentMonthSpent / maxVal) * 100
                );
                const rem =
                  cat.remainingBudget ??
                  Math.max(0, cat.recommendedBudget - cat.currentMonthSpent);
                const perDay =
                  remainingDays > 0 ? Math.round(rem / remainingDays) : 0;

                const isOver = cat.currentMonthSpent > cat.recommendedBudget;
                const overAmount = cat.currentMonthSpent - cat.recommendedBudget;

                return (
                  <div
                    key={cat.categoryId}
                    className="bg-background border-2 border-outline/40 rounded-xl p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-label-bold text-xs sm:text-sm text-on-surface font-bold truncate tabular-nums">
                        {cat.categoryName} &bull; Jatah{" "}
                        {formatRupiah(cat.recommendedBudget)}
                      </span>
                      {typeof cat.weightPercent === "number" &&
                        cat.weightPercent > 0 && (
                          <span className="text-xs font-label-bold font-bold px-2 py-0.5 rounded-md bg-surface border border-outline text-primary shrink-0 tabular-nums">
                            {cat.weightPercent}%
                          </span>
                        )}
                    </div>
                    <div className="h-2.5 w-full bg-surface-container-high border border-outline/60 rounded-md overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full sketch-hatch ${
                          isOver
                            ? "bg-error-container"
                            : "bg-primary-container"
                        }`}
                      />
                    </div>
                    <p className="text-xs font-body-sm text-on-surface-variant tabular-nums">
                      {isOver ? (
                        <span className="text-error font-bold">
                          Terpakai {formatRupiah(cat.currentMonthSpent)} &bull; Melewati batas{" "}
                          {formatRupiah(overAmount)}
                        </span>
                      ) : (
                        <>
                          Terpakai {formatRupiah(cat.currentMonthSpent)} &bull; Sisa{" "}
                          {formatRupiah(rem)} ({formatRupiah(perDay)}/hari)
                        </>
                      )}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* PILAR 3: POS SEKUNDER / VARIABEL (PROPORSIONAL) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="min-w-0 bg-surface comic-card p-5 flex flex-col gap-4"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary-container text-on-secondary-container border-2 border-outline font-label-bold font-bold text-xs mb-2.5 sketch-hatch">
              <span className="material-symbols-outlined text-sm">
                local_cafe
              </span>
              <span>3. Pos Sekunder / Variabel</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-display-lg font-extrabold text-on-surface tracking-tight tabular-nums">
              {formatRupiah(pillar3Total)}
            </h2>
            <p className="text-xs font-body-sm text-on-surface-variant mt-0.5 tabular-nums">
              {useCleanBalance && pillar3RecommendedTotal !== pillar3Total
                ? `Sisa dari jatah ${formatRupiah(pillar3RecommendedTotal)}`
                : "Sesuai rasio pengeluaran 4 bulan"}{" "}
              &bull; Kuota {formatRupiah(dailyDiscretionaryBudget)}/hari
            </p>
          </div>

          <div className="space-y-2.5 flex-1">
            {discretionaryCategories.length === 0 ? (
              <div className="bg-background border-2 border-dashed border-outline/60 rounded-xl p-4 text-center text-xs text-on-surface-variant sketch-hatch">
                Belum ada kategori Pos Sekunder / Gaya Hidup.
              </div>
            ) : (
              discretionaryCategories.map((cat) => {
                const maxVal = Math.max(
                  cat.recommendedBudget,
                  cat.currentMonthSpent,
                  1
                );
                const pct = Math.min(
                  100,
                  (cat.currentMonthSpent / maxVal) * 100
                );
                const rem =
                  cat.remainingBudget ??
                  Math.max(0, cat.recommendedBudget - cat.currentMonthSpent);
                const perDay =
                  remainingDays > 0 ? Math.round(rem / remainingDays) : 0;

                const isOver = cat.currentMonthSpent > cat.recommendedBudget;
                const overAmount = cat.currentMonthSpent - cat.recommendedBudget;

                return (
                  <div
                    key={cat.categoryId}
                    className="bg-background border-2 border-outline/40 rounded-xl p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-label-bold text-xs sm:text-sm text-on-surface font-bold truncate tabular-nums">
                        {cat.categoryName} &bull; Jatah{" "}
                        {formatRupiah(cat.recommendedBudget)}
                      </span>
                      {typeof cat.weightPercent === "number" &&
                        cat.weightPercent > 0 && (
                          <span className="text-xs font-label-bold font-bold px-2 py-0.5 rounded-md bg-surface border border-outline text-secondary shrink-0 tabular-nums">
                            {cat.weightPercent}%
                          </span>
                        )}
                    </div>
                    <div className="h-2.5 w-full bg-surface-container-high border border-outline/60 rounded-md overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full sketch-hatch ${
                          isOver
                            ? "bg-error-container"
                            : "bg-secondary-container"
                        }`}
                      />
                    </div>
                    <p className="text-xs font-body-sm text-on-surface-variant tabular-nums">
                      {isOver ? (
                        <span className="text-error font-bold">
                          Terpakai {formatRupiah(cat.currentMonthSpent)} &bull; Melewati batas{" "}
                          {formatRupiah(overAmount)}
                        </span>
                      ) : (
                        <>
                          Terpakai {formatRupiah(cat.currentMonthSpent)} &bull; Sisa{" "}
                          {formatRupiah(rem)} ({formatRupiah(perDay)}/hari)
                        </>
                      )}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Kartu Ringkasan Batas Harian & Peringatan Sistem */}
      <div className="bg-surface comic-card overflow-hidden flex flex-col">
        <div className="bg-surface-container border-b-[3px] border-outline px-5 sm:px-6 py-3.5 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-xl">
              analytics
            </span>
            <h2 className="font-headline-md text-base sm:text-lg text-on-surface font-extrabold">
              Evaluasi Kuota Harian & Rincian Siklus
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {budget.budgetCycle?.isPaydayCycle && (
              <span className="inline-flex items-center min-h-9 px-3 text-xs font-label-bold font-bold bg-tertiary-container text-on-tertiary-container rounded-lg border-2 border-outline">
                Siklus Gajian: {budget.budgetCycle.label}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="min-h-11 px-3.5 inline-flex items-center gap-1 font-label-bold font-bold text-xs sm:text-sm bg-surface hover:bg-surface-bright border-2 border-outline rounded-xl text-on-surface active-press-sm shadow-[2px_2px_0_0_var(--theme-outline)] cursor-pointer"
            >
              <span>{showDetails ? "Tutup Rincian" : "Lihat Rincian"}</span>
              <span className="material-symbols-outlined text-base leading-none">
                {showDetails ? "expand_less" : "expand_more"}
              </span>
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
        {isOverBudget ? (
          <div className="bg-error-container border-2 border-outline rounded-xl p-5 shadow-[3px_3px_0_0_var(--theme-outline)] text-on-error-container space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-error-container font-bold text-2xl">
                  warning
                </span>
                <h3 className="font-label-bold font-extrabold text-base tracking-tight">
                  Peringatan: Melewati Batas Pengeluaran Hari Ini
                </h3>
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-extrabold uppercase bg-surface text-on-surface border-2 border-outline tabular-nums">
                {percentUsed}% Terpakai
              </span>
            </div>
            <p className="font-body-md text-sm leading-relaxed tabular-nums">
              Pengeluaran harian Anda hari ini sudah mencapai{" "}
              <strong className="font-extrabold underline">
                {formatRupiah(eligibleDailySpending)}
              </strong>{" "}
              ({percentUsed}% dari rekomendasi {formatRupiah(dailyBudget)}/hari), melebihi rekomendasi harian sebesar{" "}
              <strong className="font-extrabold underline">
                {formatRupiah(overAmount)}
              </strong>
              .
            </p>
            <div className="h-3.5 w-full bg-surface/70 border-2 border-outline rounded-lg overflow-hidden relative">
              <div className="h-full bg-error w-full sketch-hatch" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="bg-surface rounded-xl border-2 border-outline p-3 text-on-surface text-xs">
                <span className="font-label-bold font-bold block text-xs text-on-surface-variant">
                  Kebutuhan Pokok (Makan/BBM)
                </span>
                <span className="font-extrabold text-sm tabular-nums">
                  {formatRupiah(essentialDailySpending)} / {formatRupiah(dailyEssentialBudget)}
                </span>
                {dailyCheck?.isOverEssentialBudget && (
                  <span className="text-xs font-bold text-error block mt-0.5">Lewat kuota pokok</span>
                )}
              </div>
              <div className="bg-surface rounded-xl border-2 border-outline p-3 text-on-surface text-xs">
                <span className="font-label-bold font-bold block text-xs text-on-surface-variant">
                  Kebutuhan Sekunder (Jajan/Hiburan)
                </span>
                <span className="font-extrabold text-sm tabular-nums">
                  {formatRupiah(discretionaryDailySpending)} / {formatRupiah(dailyDiscretionaryBudget)}
                </span>
                {dailyCheck?.isOverDiscretionaryBudget && (
                  <span className="text-xs font-bold text-error block mt-0.5">Lewat kuota sekunder</span>
                )}
              </div>
            </div>
            <p className="font-label-md text-xs opacity-90">
              Catatan: Pembayaran cicilan hutang dan tagihan tetap bulanan (kos, listrik, dll) tidak dihitung dalam batas harian ini.
            </p>
          </div>
        ) : (
          <div className="bg-background rounded-xl border-2 border-outline/45 p-5 flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="font-label-bold font-bold text-xs uppercase text-on-surface-variant block mb-1">
                  Batas Belanja Hari Ini (Total)
                </span>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5">
                  <span className="text-2xl sm:text-3xl font-display-lg font-extrabold text-primary tracking-tight tabular-nums">
                    {formatRupiah(dailyRemainingBalance)}
                  </span>
                  <span className="text-xs sm:text-sm font-label-bold font-semibold text-on-surface-variant tabular-nums">
                    tersisa dari kuota {formatRupiah(dailyBudget)}/hari
                  </span>
                </div>
                {dailyCheck && dailyCheck.excludedCount > 0 && (
                  <p className="text-xs text-tertiary dark:text-tertiary-fixed font-bold mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>{dailyCheck.excludedCount} tagihan bulanan/cicilan hari ini dikecualikan</span>
                  </p>
                )}
              </div>

              <div className="w-full md:w-64 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-label-bold font-bold text-on-surface">
                  <div className="flex items-center gap-1.5">
                    <span>Terpakai Hari Ini</span>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-extrabold border tabular-nums ${
                      percentUsed >= 80
                        ? "bg-primary-container text-on-primary-container border-outline"
                        : "bg-primary/15 text-primary border-primary/40"
                    }`}>
                      {percentUsed}%
                    </span>
                  </div>
                  <span className="tabular-nums">{formatRupiah(eligibleDailySpending)}</span>
                </div>
                <div className="h-3.5 w-full bg-surface-container-high border-2 border-outline rounded-lg overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dailyProgressPercent}%` }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className={`h-full sketch-hatch ${
                      percentUsed >= 80 ? "bg-primary-container" : "bg-primary"
                    }`}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-on-surface-variant font-label-md">
                  {percentUsed >= 80 ? (
                    <span className="text-primary dark:text-primary-fixed font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      Mendekati batas
                    </span>
                  ) : (
                    <span></span>
                  )}
                  <span className="text-right tabular-nums">
                    Tersisa {remainingDays} hari di siklus ini
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t-2 border-outline/20">
              <div className="bg-surface rounded-xl border-2 border-outline/40 p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary shrink-0"></span>
                    <span className="font-label-bold font-bold text-xs uppercase text-on-surface truncate">
                      Batas Pokok Harian
                    </span>
                  </div>
                  <span className="text-xs text-on-surface-variant font-label-md truncate shrink-0 tabular-nums">
                    {dailyEssentialBudget > 0 ? `Kuota ${formatRupiah(dailyEssentialBudget)}/hari` : "Tanpa kuota (Rp 0)"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-outline/20">
                  <div>
                    <span className="text-xs font-label-bold font-semibold text-on-surface-variant block">
                      Terpakai
                    </span>
                    <span className={`font-display-lg text-base font-extrabold block tabular-nums ${
                      dailyCheck?.isOverEssentialBudget ? "text-error" : "text-on-surface"
                    }`}>
                      {formatRupiah(essentialDailySpending)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-label-bold font-semibold text-on-surface-variant block">
                      Sisa Kuota
                    </span>
                    <span className="font-display-lg text-base font-extrabold text-tertiary dark:text-tertiary-fixed block tabular-nums">
                      {formatRupiah(essentialRemaining)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-xl border-2 border-outline/40 p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0"></span>
                    <span className="font-label-bold font-bold text-xs uppercase text-on-surface truncate">
                      Batas Sekunder Harian
                    </span>
                  </div>
                  <span className="text-xs text-on-surface-variant font-label-md truncate shrink-0 tabular-nums">
                    {dailyDiscretionaryBudget > 0 ? `Kuota ${formatRupiah(dailyDiscretionaryBudget)}/hari` : "Tanpa kuota (Rp 0)"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-outline/20">
                  <div>
                    <span className="text-xs font-label-bold font-semibold text-on-surface-variant block">
                      Terpakai
                    </span>
                    <span className={`font-display-lg text-base font-extrabold block tabular-nums ${
                      dailyCheck?.isOverDiscretionaryBudget ? "text-error" : "text-on-surface"
                    }`}>
                      {formatRupiah(discretionaryDailySpending)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-label-bold font-semibold text-on-surface-variant block">
                      Sisa Kuota
                    </span>
                    <span className="font-display-lg text-base font-extrabold text-secondary block tabular-nums">
                      {formatRupiah(discretionaryRemaining)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(actionAlerts.length > 0 || infoNotes.length > 0) && (
          <div className="space-y-2.5">
            {actionAlerts.length > 0 && (
              <div className="space-y-2">
                {actionAlerts.map((w) => {
                  const isCrit = w.severity === "critical";
                  return (
                    <div
                      key={w.id}
                      className={`rounded-xl border-2 p-3.5 text-xs sm:text-sm flex items-start gap-3 ${
                        isCrit
                          ? "bg-error-container/35 text-on-surface border-error"
                          : "bg-primary-container/25 text-on-surface border-outline/60"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-base mt-0.5 shrink-0 ${
                          isCrit ? "text-error" : "text-primary dark:text-primary-fixed"
                        }`}
                      >
                        {isCrit ? "error" : "warning"}
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <strong className="font-label-bold font-bold block text-sm tracking-normal">
                          {w.title}
                        </strong>
                        <p className="font-body-sm text-xs opacity-90 leading-relaxed">
                          {w.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {infoNotes.length > 0 && (
              <div className="bg-surface-container/60 border-2 border-outline/30 rounded-xl overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setShowInfoNotes((prev) => !prev)}
                  className="w-full min-h-11 px-3.5 py-2.5 flex items-center justify-between text-xs sm:text-sm font-label-bold font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-tertiary">tune</span>
                    <span>Catatan Penyesuaian Anggaran ({infoNotes.length})</span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                      showInfoNotes ? "rotate-180" : ""
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                <AnimatePresence>
                  {showInfoNotes && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-3.5 pb-3 pt-1.5 border-t border-outline/20 space-y-2 text-xs"
                    >
                      {infoNotes.map((note) => (
                        <div key={note.id} className="flex items-start gap-2 text-on-surface-variant">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline/60 mt-1.5 shrink-0" />
                          <div className="leading-relaxed">
                            <span className="font-bold text-on-surface">{note.title}: </span>
                            <span className="opacity-90">{note.description}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-background rounded-xl border-2 border-outline/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-label-bold font-bold text-xs uppercase text-on-surface-variant">
                    1. Total Pemasukan
                  </span>
                  {budget.isIncomeEstimated && (
                    <span className="text-xs font-bold px-1.5 py-0.5 bg-secondary text-on-secondary rounded-md">
                      Proyeksi
                    </span>
                  )}
                </div>
                <span className="material-symbols-outlined text-tertiary text-lg">
                  payments
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-display-lg font-extrabold text-tertiary dark:text-tertiary-fixed tabular-nums">
                {formatRupiah(eligibleIncome)}
              </h3>
            </div>
            <p className="font-label-md text-xs text-on-surface-variant mt-2">
              {budget.isIncomeEstimated
                ? `Akumulasi siklus ini masih berjalan. Menggunakan proyeksi acuan ${budget.estimatedIncomeMonth || "siklus lalu"}.`
                : "Akumulasi pemasukan dari seluruh akun yang tercatat di siklus ini."}
            </p>
          </div>

          <div className="bg-background rounded-xl border-2 border-outline/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-bold font-bold text-xs uppercase text-on-surface-variant">
                  2. Beban Cicilan
                </span>
                <span className="material-symbols-outlined text-error text-lg">
                  account_balance
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-display-lg font-extrabold text-error tabular-nums">
                {formatRupiah(totalDebtObligation)}
              </h3>
              {budget.paidDebtInCycle > 0 && (
                <div className="mt-1 flex items-center gap-1 text-xs font-bold text-tertiary dark:text-tertiary-fixed tabular-nums">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>{formatRupiah(budget.paidDebtInCycle)} terbayar di muka</span>
                </div>
              )}
            </div>
            <p className="font-label-md text-xs text-on-surface-variant mt-2">
              Dihitung dari cicilan jatuh tempo dan pembayaran di muka dalam siklus ini
            </p>
          </div>

          <div className="bg-background rounded-xl border-2 border-outline/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-label-bold font-bold text-xs uppercase text-on-surface-variant">
                    3. Tabungan Terkunci
                  </span>
                  {(budget.monthlySavingTarget ?? 0) > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-secondary-container text-on-secondary-container border border-outline rounded-md tabular-nums">
                      Bulan ini: {formatRupiah(budget.monthlySavingTarget || 0)}
                    </span>
                  )}
                </div>
                <span className="material-symbols-outlined text-secondary text-lg">
                  lock
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-display-lg font-extrabold text-secondary dark:text-secondary-fixed tabular-nums">
                {formatRupiah(budget.cumulativeSavings || 0)}
              </h3>
            </div>
            <p className="font-label-md text-xs text-on-surface-variant mt-2">
              Akumulasi tabungan yang dikunci dari saldo agar sisa uang akhir bulan terjamin
            </p>
          </div>

          <div className="bg-background rounded-xl border-2 border-outline/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-bold font-bold text-xs uppercase text-on-surface-variant">
                  4. Dana Harian Bebas
                </span>
                <span className="material-symbols-outlined text-primary text-lg">
                  shopping_bag
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-display-lg font-extrabold text-primary tabular-nums">
                {formatRupiah(fundsForDaily)}
              </h3>
              <div className="mt-2 space-y-1 text-xs font-label-md">
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    Pokok:
                  </span>
                  <strong className="text-on-surface tabular-nums">{formatRupiah(budget.remainingEssentialFunds)}</strong>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    Sekunder:
                  </span>
                  <strong className="text-on-surface tabular-nums">{formatRupiah(budget.remainingDiscretionaryFunds)}</strong>
                </div>
              </div>
              {budget.pastDailyExpensesInCycle > 0 && (
                <p className="text-xs text-on-surface-variant mt-2 font-bold tabular-nums">
                  Terpakai {formatRupiah(budget.pastDailyExpensesInCycle)} sebelum hari ini
                </p>
              )}
            </div>
            <p className="font-label-md text-xs text-on-surface-variant mt-2 tabular-nums">
              Sisa dana siap pakai untuk {remainingDays} hari ({formatRupiah(dailyBudget)}/hari)
            </p>
          </div>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 pt-4 border-t-2 border-outline border-dashed overflow-hidden"
            >
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
                      <div className="bg-surface rounded-xl border-2 border-outline p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-[2px_2px_0_0_var(--theme-outline)]">
                        <div className="min-w-0 flex-1 space-y-1">
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
                        <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-end pt-2 sm:pt-0 border-t sm:border-t-0 border-outline/20 shrink-0">
                          <span className="text-[10px] uppercase font-label-bold text-on-surface-variant">
                            Telah Terpotong
                          </span>
                          <span className="text-sm sm:text-base font-display-lg font-bold text-tertiary dark:text-tertiary-fixed">
                            {formatRupiah(budget.paidDebtInCycle)}
                          </span>
                        </div>
                      </div>
                    )}

                    {debtObligations.map((d) => (
                      <div
                        key={d.debtId}
                        className="bg-surface rounded-xl border-2 border-outline p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-[2px_2px_0_0_var(--theme-outline)]"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
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
                        <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-end pt-2 sm:pt-0 border-t sm:border-t-0 border-outline/20 shrink-0">
                          <span className="text-[10px] uppercase font-label-bold text-on-surface-variant">
                            Beban Siklus Ini
                          </span>
                          <span className={`text-sm sm:text-base font-display-lg font-bold ${
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
                      const isZeroBudget = cat.recommendedBudget === 0;
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
                        cat.recommendedBudget > 0
                          ? cat.currentMonthSpent > cat.recommendedBudget
                          : cat.currentMonthSpent > 0;

                      return (
                        <div
                          key={cat.categoryId}
                          className="bg-surface rounded-xl border-2 border-outline p-3 space-y-2 shadow-[2px_2px_0_0_var(--theme-outline)]"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-label-bold text-sm text-on-surface truncate">
                                  {cat.categoryName}
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border border-outline ${
                                  cat.isFixed
                                    ? "bg-primary-container text-on-primary-container"
                                    : cat.isEssential
                                    ? "bg-tertiary-container text-on-tertiary-container"
                                    : "bg-secondary-container text-on-secondary-container"
                                }`}>
                                  {cat.isFixed ? "Tetap" : cat.isEssential ? "Pokok" : "Sekunder"}
                                </span>
                                {isZeroBudget && (
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-error/15 text-error border border-error/30">
                                    Anggaran Rp 0
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-on-surface-variant font-label-md flex items-center gap-1.5 flex-wrap tabular-nums mt-0.5">
                                <span>Historis: {formatRupiah(cat.historicalAvg)}/bln</span>
                                {typeof cat.weightPercent === "number" && cat.weightPercent > 0 && !cat.isFixed && (
                                  <span className="font-bold text-primary dark:text-primary-fixed">
                                    • Bobot {cat.weightPercent}%
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-label-bold text-on-surface-variant block">
                                Target
                              </span>
                              <span className={`text-sm font-display-lg font-extrabold tabular-nums ${
                                isZeroBudget ? "text-error" : "text-primary"
                              }`}>
                                {formatRupiah(cat.recommendedBudget)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-label-bold tabular-nums">
                              <span className="text-on-surface-variant">
                                Terpakai: {formatRupiah(cat.currentMonthSpent)}
                              </span>
                              {isOverCategory ? (
                                <span className="text-error font-bold">
                                  {isZeroBudget ? "Melebihi target (kuota Rp 0)" : "Melebihi target"}
                                </span>
                              ) : (
                                <span className="text-tertiary dark:text-tertiary-fixed font-bold">
                                  Sisa: {formatRupiah(cat.remainingBudget ?? Math.max(0, cat.recommendedBudget - cat.currentMonthSpent))}
                                </span>
                              )}
                            </div>
                            <div className="h-2.5 w-full bg-surface-container border border-outline/60 rounded-md overflow-hidden">
                              <div
                                style={{ width: `${isZeroBudget && cat.currentMonthSpent > 0 ? 100 : spentRatio}%` }}
                                className={`h-full transition-all duration-300 sketch-hatch ${
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
      </div>
    </div>
  );
}
