"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgetRecommendation } from "@/hooks/useBudgetRecommendation";
import { useGlobalData } from "@/lib/data-context";
import { MonthSelector } from "@/components/layout/MonthSelector";
import { BudgetCard } from "@/components/dashboard/BudgetCard";

export default function BudgetPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { transactions, loading: txLoading } = useTransactions(year, month);
  const {
    budget,
    dailyCheck,
    loading: budgetLoading,
  } = useBudgetRecommendation(year, month, transactions);
  const { budgetSource, setBudgetSource, budgetCalculationMode, setBudgetCalculationMode } = useGlobalData();

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h2 className="font-headline-lg text-2xl sm:text-3xl text-on-surface tracking-tight uppercase">
            ANGGARAN
          </h2>
          <p className="font-body-md text-sm sm:text-base text-on-surface-variant mt-1">
            Rekomendasi alokasi anggaran otomatis.
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

      {/* Kontrol Konfigurasi Anggaran */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Kontrol Sumber Anggaran */}
        <div className="bg-surface-container border-3 border-outline shadow-[3px_3px_0_0_var(--theme-outline)] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-container border-2 border-outline flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-lg">tune</span>
            </div>
            <div>
              <h4 className="font-label-bold text-xs sm:text-sm uppercase text-on-surface">
                Sumber Anggaran
              </h4>
              <p className="font-body-sm text-[11px] text-on-surface-variant">
                Pemasukan rutin saja atau seluruh pemasukan
              </p>
            </div>
          </div>

          <div className="bg-surface border-2 border-outline rounded-xl p-1 flex items-center gap-1 w-full shadow-[1px_1px_0_0_var(--theme-outline)]">
            <button
              type="button"
              onClick={() => setBudgetSource("eligible_only")}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-label-bold uppercase flex items-center justify-center gap-1 transition-all ${
                budgetSource === "eligible_only"
                  ? "bg-primary text-on-primary border-2 border-outline shadow-[1px_1px_0_0_var(--theme-outline)]"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-sm">verified</span>
              <span className="truncate">Dasar Anggaran</span>
            </button>

            <button
              type="button"
              onClick={() => setBudgetSource("all_income")}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-label-bold uppercase flex items-center justify-center gap-1 transition-all ${
                budgetSource === "all_income"
                  ? "bg-primary text-on-primary border-2 border-outline shadow-[1px_1px_0_0_var(--theme-outline)]"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-sm">all_inclusive</span>
              <span className="truncate">Semua Anggaran</span>
            </button>
          </div>
        </div>

        {/* Kontrol Mode Evaluasi Harian */}
        <div className="bg-surface-container border-3 border-outline shadow-[3px_3px_0_0_var(--theme-outline)] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-tertiary-container border-2 border-outline flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-tertiary text-lg">calendar_today</span>
            </div>
            <div>
              <h4 className="font-label-bold text-xs sm:text-sm uppercase text-on-surface">
                Mode Kuota Harian
              </h4>
              <p className="font-body-sm text-[11px] text-on-surface-variant">
                Pilih metode perataan atau pemotongan langsung 1:1
              </p>
            </div>
          </div>

          <div className="bg-surface border-2 border-outline rounded-xl p-1 flex items-center gap-1 w-full shadow-[1px_1px_0_0_var(--theme-outline)]">
            <button
              type="button"
              onClick={() => setBudgetCalculationMode("adaptive")}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-label-bold uppercase flex items-center justify-center gap-1 transition-all ${
                budgetCalculationMode === "adaptive"
                  ? "bg-tertiary text-on-tertiary border-2 border-outline shadow-[1px_1px_0_0_var(--theme-outline)]"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-sm">balance</span>
              <span className="truncate">Adaptif (Rata)</span>
            </button>

            <button
              type="button"
              onClick={() => setBudgetCalculationMode("strict_rollover")}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-label-bold uppercase flex items-center justify-center gap-1 transition-all ${
                budgetCalculationMode === "strict_rollover"
                  ? "bg-tertiary text-on-tertiary border-2 border-outline shadow-[1px_1px_0_0_var(--theme-outline)]"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-sm">bolt</span>
              <span className="truncate">Disiplin Ketat (1:1)</span>
            </button>
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
