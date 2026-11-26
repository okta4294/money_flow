"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgetRecommendation } from "@/hooks/useBudgetRecommendation";
import { useGlobalData } from "@/lib/data-context";
import { PageHeader } from "@/components/layout/PageHeader";
import { BudgetCard } from "@/components/dashboard/BudgetCard";
import { BudgetSavingsCard } from "@/components/budget/BudgetSavingsCard";

import { formatRupiah } from "@/lib/utils";

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
    addSavingsWithdrawal,
    deleteSavingsWithdrawal,
  } = useBudgetRecommendation(year, month, transactions);
  const { budgetCalculationMode, setBudgetCalculationMode } = useGlobalData();

  return (
    <>
      <PageHeader
        title="Anggaran & Tabungan"
        subtitle={
          budgetCalculationMode === "adaptive"
            ? "Mode Adaptif: Bagi rata sisa saldo bersih dengan sisa hari"
            : "Mode Disiplin 1:1: Akumulasi kuota harian hari per hari"
        }
        year={year}
        month={month}
        onMonthChange={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
        action={
          <div className="min-h-11 w-full sm:w-auto bg-surface-container comic-subcard p-1 flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setBudgetCalculationMode("adaptive")}
              className={`flex-1 sm:flex-initial min-h-9 px-3.5 rounded-lg text-xs sm:text-sm font-label-bold font-bold transition-all cursor-pointer flex items-center justify-center ${
                budgetCalculationMode === "adaptive"
                  ? "bg-tertiary-container text-on-tertiary-container border-2 border-outline sketch-hatch"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Mode Adaptif: Bagi rata sisa saldo bersih dengan sisa hari"
            >
              Adaptif
            </button>
            <button
              type="button"
              onClick={() => setBudgetCalculationMode("strict_rollover")}
              className={`flex-1 sm:flex-initial min-h-9 px-3.5 rounded-lg text-xs sm:text-sm font-label-bold font-bold transition-all cursor-pointer flex items-center justify-center ${
                budgetCalculationMode === "strict_rollover"
                  ? "bg-tertiary-container text-on-tertiary-container border-2 border-outline sketch-hatch"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Mode Disiplin (1:1): Akumulasi kuota harian hari per hari"
            >
              Disiplin 1:1
            </button>
          </div>
        }
      />

      <div className="w-full mb-2">
        <BudgetSavingsCard
          year={year}
          month={month}
          savingsSummary={
            savingsSummary || {
              currentTargetAmount: 0,
              hasCustomTargetThisMonth: false,
              cumulativeSavings: 0,
              grossSavings: 0,
              totalWithdrawn: 0,
              previousMonthTarget: 0,
              breakdown: [],
              withdrawals: [],
            }
          }
          savingsRecommendation={budget?.savingsRecommendation}
          onSaveTarget={async (target) => {
            await saveMonthlySaving(year, month, target);
          }}
          onWithdraw={async (data) => {
            await addSavingsWithdrawal(data);
          }}
          onDeleteWithdrawal={async (id) => {
            await deleteSavingsWithdrawal(id);
          }}
          loading={budgetLoading || txLoading}
        />
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
