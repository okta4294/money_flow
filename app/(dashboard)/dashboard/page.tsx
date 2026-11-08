"use client";

import { useState, useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useDebts } from "@/hooks/useDebts";
import { useGlobalData } from "@/lib/data-context";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { SafeToSpendCard } from "@/components/dashboard/SafeToSpendCard";
import { useBudgetRecommendation } from "@/hooks/useBudgetRecommendation";
import { Transaction } from "@/lib/firestore/transactions";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { transactions, loading, totalIncome, totalExpense } = useTransactions(year, month);
  const { categories } = useCategories();
  const { activeDebts, totalDebt } = useDebts();
  const {
    budget,
    dailyCheck,
    loading: budgetLoading,
  } = useBudgetRecommendation(year, month, transactions);

  const {
    accounts,
    accountsLoading,
    totalAccountBalance,
    accountBalancesLoading,
  } = useGlobalData();
  const balanceLoading = accountsLoading || accountBalancesLoading;
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  // Total saldo kas riil berdasarkan akumulasi saldo seluruh akun
  const totalKas = accounts.length > 0 ? totalAccountBalance : (totalIncome - totalExpense);

  // Saldo dingin: saldo riil setelah dipotong hutang jatuh tempo, kebutuhan tetap, dan target saving
  const debtDeduction = budget
    ? (budget.debtObligations ? budget.debtObligations.reduce((sum, d) => sum + d.monthlyObligation, 0) : budget.totalDebtObligation)
    : totalDebt;
  const fixedDeduction = budget?.unpaidFixedObligation ?? 0;
  const savingsDeduction = budget?.cumulativeSavings ?? budget?.monthlySavingTarget ?? 0;

  const coldBalance = budget?.availableBalanceForDaily !== undefined
    ? budget.availableBalanceForDaily
    : (totalKas - debtDeduction - fixedDeduction - savingsDeduction);

  const recentTransactions = transactions.slice(0, 5);

  const maxCashflow = Math.max(totalIncome, totalExpense, 1);
  const incomePercent = (totalIncome / maxCashflow) * 100;
  const expensePercent = (totalExpense / maxCashflow) * 100;

  const withSpending = useMemo(() => {
    const expenseCategories = categories.filter((c) => c.type === "expense");
    return expenseCategories
      .map((cat) => ({
        cat,
        spent: transactions
          .filter((t) => t.type === "expense" && t.categoryId === cat.id)
          .reduce((s, t) => s + t.amount, 0),
      }))
      .filter((x) => x.spent > 0)
      .sort((a, b) => b.spent - a.spent);
  }, [categories, transactions]);

  const maxSpent = withSpending[0]?.spent || 1;
  const expenseToIncomeRatio =
    totalIncome > 0
      ? Math.round((totalExpense / totalIncome) * 100)
      : totalExpense > 0
      ? 100
      : 0;

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);

  return (
    <>
      <PageHeader
        title="Dasbor"
        subtitle="Hai miskin gimana kabarnya"
        year={year}
        month={month}
        onMonthChange={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
      />

      <div className="grid grid-cols-12 gap-5 sm:gap-6 w-full">
        {/* Kartu 1: Total Saldo Bersih (Saldo Dingin) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="col-span-12 lg:col-span-8 bg-primary-container border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] p-5 sm:p-6 md:p-7 flex flex-col justify-between gap-4 relative overflow-hidden rounded-3xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="h-9 inline-flex items-center gap-2 px-3.5 rounded-xl bg-surface text-on-surface border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)]">
              <span className="material-symbols-outlined text-base">
                account_balance_wallet
              </span>
              <h2 className="font-label-bold text-[11px] sm:text-xs font-extrabold uppercase tracking-wide">
                Total Saldo Bersih
              </h2>
            </div>

            <Link
              href="/accounts"
              className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-surface hover:bg-surface-bright text-on-surface border-2 border-outline text-[11px] sm:text-xs font-label-bold uppercase shadow-[2px_2px_0_0_var(--theme-outline)] active-press-sm transition-colors"
            >
              <span>Kelola Dompet</span>
            </Link>
          </div>

          <div className="my-1 sm:my-2">
            <h3 className="text-[clamp(2.25rem,5vw,3.75rem)] leading-none tracking-tight font-display-lg font-black text-on-primary-container break-words w-full">
              {balanceLoading || (budgetLoading && !budget) ? (
                <span className="animate-pulse opacity-50">Rp ...</span>
              ) : (
                formatIDR(coldBalance)
              )}
            </h3>
          </div>

          <div className="bg-surface/95 dark:bg-surface border-2 border-outline rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs font-label-bold text-on-surface shadow-[2px_2px_0_0_var(--theme-outline)]">
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-base text-tertiary">
                verified_user
              </span>
              <span>
                Aman dipakai (Sudah potong Hutang Jatuh Tempo, Pos Tetap & Tabungan)
              </span>
            </span>
            {!balanceLoading && (
              <span className="font-extrabold text-on-surface whitespace-nowrap">
                Total Kas Riil: {formatIDR(totalKas)}
              </span>
            )}
          </div>
        </motion.div>

        {/* Kartu 2: Roasting Keuangan AI */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="col-span-12 lg:col-span-4 h-full min-h-[260px] bg-tertiary-container border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] p-5 sm:p-6 flex flex-col relative rounded-3xl"
        >
          {!loading && !balanceLoading ? (
            <AISummaryCard
              transactions={transactions}
              month={month}
              year={year}
              initialBalance={totalKas}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              activeDebts={activeDebts}
              totalDebt={totalDebt}
            />
          ) : (
            <div className="animate-pulse flex flex-col h-full space-y-4 pt-4">
              <div className="h-4 w-full bg-surface-bright rounded"></div>
              <div className="h-4 w-full bg-surface-bright rounded"></div>
              <div className="h-4 w-3/4 bg-surface-bright rounded"></div>
            </div>
          )}
        </motion.div>

        {/* Kartu 3: Batas Belanja Hari Ini (Dual Quota Safe-To-Spend) */}
        <SafeToSpendCard
          budget={budget}
          dailyCheck={dailyCheck}
          loading={budgetLoading || loading}
        />

        {/* Kartu 4 (Kiri Bawah - 5 Kolom): Arus Kas & Pos Pengeluaran */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="col-span-12 lg:col-span-5 bg-surface border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-headline-md text-base sm:text-lg text-on-surface uppercase font-extrabold">
              Arus Kas & Pos Pengeluaran
            </h4>
            <span className="px-3 py-1 rounded-xl bg-secondary-container text-on-secondary-container border-2 border-outline font-label-bold text-[11px] uppercase shadow-[1.5px_1.5px_0_0_var(--theme-outline)] shrink-0">
              Bulan Ini
            </span>
          </div>

          <div className="flex flex-col gap-3.5 flex-1">
            {/* Kotak Pemasukan Bulan Ini */}
            <div className="bg-background border-2 border-outline rounded-2xl p-3.5 space-y-2 shadow-[2px_2px_0_0_var(--theme-outline)]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-bold text-xs text-on-surface uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-tertiary">
                    arrow_upward
                  </span>
                  <span>Pemasukan Bulan Ini</span>
                </span>
                <span className="font-display-lg text-base sm:text-lg font-extrabold text-tertiary dark:text-tertiary-fixed">
                  +{formatIDR(totalIncome)}
                </span>
              </div>
              <div className="h-3.5 w-full bg-surface-container-high border-2 border-outline rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${incomePercent}%` }}
                  transition={{ duration: 0.8, type: "spring" }}
                  className="h-full bg-tertiary-container border-r-2 border-outline"
                />
              </div>
            </div>

            {/* Kotak Total Pengeluaran */}
            <div className="bg-background border-2 border-outline rounded-2xl p-3.5 space-y-2 shadow-[2px_2px_0_0_var(--theme-outline)]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-bold text-xs text-on-surface uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-error">
                    arrow_downward
                  </span>
                  <span>Total Pengeluaran ({expenseToIncomeRatio}%)</span>
                </span>
                <span className="font-display-lg text-base sm:text-lg font-extrabold text-error">
                  -{formatIDR(totalExpense)}
                </span>
              </div>
              <div className="h-3.5 w-full bg-surface-container-high border-2 border-outline rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${expensePercent}%` }}
                  transition={{ duration: 0.8, type: "spring", delay: 0.1 }}
                  className="h-full bg-error-container border-r-2 border-outline"
                />
              </div>
            </div>

            {/* Kotak Pos Terbesar */}
            <div className="bg-surface-container border-2 border-outline rounded-2xl p-3.5 space-y-2.5 flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-bold text-[11px] uppercase text-on-surface font-extrabold">
                  Pos Pengeluaran Terbesar:
                </span>
                <Link
                  href="/categories"
                  className="text-[10px] font-label-bold uppercase text-secondary hover:underline"
                >
                  Atur Pos &rarr;
                </Link>
              </div>

              {withSpending.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic">
                  Belum ada pengeluaran yang tercatat di bulan ini.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-body-md text-on-surface-variant leading-relaxed">
                    {withSpending
                      .slice(0, 4)
                      .map(
                        ({ cat, spent }, idx) =>
                          `${idx + 1}. ${cat.name} (${formatIDR(spent)})`
                      )
                      .join(" • ")}
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {withSpending.slice(0, 3).map(({ cat, spent }, idx) => {
                      const barColors = [
                        "bg-primary-container",
                        "bg-secondary-container",
                        "bg-tertiary-container",
                      ];
                      return (
                        <div key={cat.id} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-label-bold">
                            <span className="truncate text-on-surface">
                              {cat.name}
                            </span>
                            <span className="text-on-surface shrink-0">
                              {formatIDR(spent)}
                            </span>
                          </div>
                          <div className="h-2.5 w-full bg-surface border border-outline rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColors[idx % 3]} border-r border-outline`}
                              style={{ width: `${(spent / maxSpent) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Kartu 5 (Kanan Bawah - 7 Kolom): Transaksi Terbaru */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="col-span-12 lg:col-span-7 bg-surface border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] rounded-3xl p-5 sm:p-6 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-headline-md text-base sm:text-lg text-on-surface uppercase font-extrabold">
              Transaksi Terbaru
            </h4>
            <Link
              className="font-label-bold text-xs uppercase text-secondary hover:underline inline-flex items-center gap-1"
              href="/transactions"
            >
              <span>Lihat Semua Riwayat</span>
              <span className="material-symbols-outlined text-sm leading-none">
                arrow_forward
              </span>
            </Link>
          </div>

          <div className="flex flex-col gap-3 flex-1 justify-start">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t) => {
                const cat = categories.find((c) => c.id === t.categoryId);
                const isTransfer = t.type === "transfer";
                const isIncome = t.type === "income";

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setEditTransaction(t);
                      setShowTransactionForm(true);
                    }}
                    className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border-2 border-outline bg-background hover:bg-surface-bright shadow-[2px_2px_0_0_var(--theme-outline)] transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl border-2 border-outline flex items-center justify-center shrink-0 text-black ${
                          isIncome
                            ? "bg-tertiary-container"
                            : isTransfer
                            ? "bg-secondary-container text-white"
                            : "bg-primary-container"
                        }`}
                      >
                        {isTransfer ? (
                          <span className="material-symbols-outlined text-xl">
                            swap_horiz
                          </span>
                        ) : cat?.icon?.includes("fa-") ? (
                          <i className={`fa-solid ${cat.icon} text-lg`}></i>
                        ) : (
                          <span className="material-symbols-outlined text-xl">
                            {cat?.icon || (isIncome ? "payments" : "receipt_long")}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-label-bold text-xs sm:text-sm text-on-surface font-extrabold truncate">
                          {t.note ||
                            (isTransfer
                              ? "Transfer Antar Akun"
                              : cat?.name || t.category || "Transaksi")}
                        </h5>
                        <p className="font-body-sm text-[11px] sm:text-xs text-on-surface-variant truncate mt-0.5">
                          {isTransfer
                            ? `${t.accountName || "?"} -> ${t.destinationAccountName || "?"}`
                            : `${cat?.name || t.category || "Tanpa Kategori"}${
                                t.accountName ? ` • ${t.accountName}` : ""
                              }`}{" "}
                          •{" "}
                          {new Date(t.date + "T00:00:00").toLocaleDateString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`font-display-lg text-sm sm:text-base md:text-lg font-extrabold whitespace-nowrap shrink-0 ${
                        isIncome
                          ? "text-tertiary dark:text-tertiary-fixed"
                          : isTransfer
                          ? "text-secondary"
                          : "text-error"
                      }`}
                    >
                      {isIncome ? "+" : isTransfer ? "" : "-"}
                      {formatIDR(t.amount)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background border-2 border-dashed border-outline rounded-2xl text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl mb-1.5">
                  receipt_long
                </span>
                <p className="font-label-bold text-xs uppercase">
                  Belum ada transaksi di bulan ini
                </p>
                <p className="text-[11px] mt-0.5">
                  Ketuk tombol + biru di kanan bawah untuk mencatat transaksi.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <FloatingActionButton
        id="add-transaction-fab"
        label="Tambah Transaksi"
        onClick={() => {
          setEditTransaction(null);
          setShowTransactionForm(true);
        }}
      />

      <TransactionForm
        open={showTransactionForm}
        onClose={() => { setShowTransactionForm(false); setEditTransaction(null); }}
        editData={editTransaction}
      />
    </>
  );
}
