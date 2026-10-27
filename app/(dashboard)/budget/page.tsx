"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgetRecommendation } from "@/hooks/useBudgetRecommendation";
import { useGlobalData } from "@/lib/data-context";
import { MonthSelector } from "@/components/layout/MonthSelector";
import { BudgetCard } from "@/components/dashboard/BudgetCard";
import { BudgetSavingsCard } from "@/components/budget/BudgetSavingsCard";

export default function BudgetPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { transactions, loading: txLoading } = useTransactions(year, month);
  const {
    budget,
    dailyCheck,
    loading: budgetLoading,
    savingsSummary,
    saveMonthlySaving,
  } = useBudgetRecommendation(year, month, transactions);
  const { budgetCalculationMode, setBudgetCalculationMode } = useGlobalData();

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl text-on-surface tracking-normal uppercase">
            ANGGARAN
          </h2>
          <p className="font-body-md text-sm sm:text-base text-on-surface-variant mt-1">
            Rekomendasi alokasi anggaran otomatis agar anda selamat sampai akhir bulan.
          </p>
        </div>
        <div className="bg-surface-container border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] flex items-center justify-center p-1 rounded-xl w-full sm:w-auto">
          <MonthSelector
            year={year}
            month={month}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <BudgetSavingsCard
            year={year}
            month={month}
            savingsSummary={
              savingsSummary || {
                currentTargetAmount: 0,
                hasCustomTargetThisMonth: false,
                cumulativeSavings: 0,
                previousMonthTarget: 0,
              }
            }
            onSaveTarget={async (target) => {
              await saveMonthlySaving(year, month, target);
            }}
            loading={budgetLoading || txLoading}
          />
        </div>

        <div className="lg:col-span-1">
          <div className="h-full bg-surface-container border-3 border-outline shadow-[3px_3px_0_0_var(--theme-outline)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-tertiary-container border-2 border-outline flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-xl">calendar_today</span>
              </div>
              <div>
                <h4 className="font-label-bold text-xs sm:text-sm uppercase text-on-surface">
                  Mode Kuota Harian
                </h4>
                <p className="font-body-sm text-[11px] text-on-surface-variant">
                  Perataan sisa dana atau carry-forward 1:1
                </p>
              </div>
            </div>

            <div className="bg-surface border-2 border-outline rounded-xl p-1 flex items-center gap-1 w-full shadow-[1px_1px_0_0_var(--theme-outline)]">
              <button
                type="button"
                onClick={() => setBudgetCalculationMode("adaptive")}
                className={`flex-1 px-2.5 py-2 rounded-lg text-xs font-label-bold uppercase flex items-center justify-center gap-1 transition-all ${
                  budgetCalculationMode === "adaptive"
                    ? "bg-tertiary text-on-tertiary border-2 border-outline shadow-[1px_1px_0_0_var(--theme-outline)]"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="truncate">Adaptif</span>
              </button>

              <button
                type="button"
                onClick={() => setBudgetCalculationMode("strict_rollover")}
                className={`flex-1 px-2.5 py-2 rounded-lg text-xs font-label-bold uppercase flex items-center justify-center gap-1 transition-all ${
                  budgetCalculationMode === "strict_rollover"
                    ? "bg-tertiary text-on-tertiary border-2 border-outline shadow-[1px_1px_0_0_var(--theme-outline)]"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="truncate">Disiplin (1:1)</span>
              </button>
            </div>

            <p className="text-[11px] font-label-md text-on-surface-variant leading-relaxed">
              {budgetCalculationMode === "adaptive"
                ? "Mode Adaptif membagi sisa saldo bersih dengan sisa hari secara merata setiap hari."
                : "Mode Disiplin mengakumulasi kuota harian hari per hari sesuai kedisiplinan pengeluaran Anda."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 w-full">
        <BudgetCard
          budget={budget}
          dailyCheck={dailyCheck}
          loading={budgetLoading || txLoading}
          month={month}
          year={year}
        />
      </div>
    </>
  );
}
