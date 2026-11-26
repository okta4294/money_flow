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
import { formatRupiah, getTransactionIcon } from "@/lib/utils";
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

  const formatIDR = formatRupiah;

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
        <div className="col-span-12 lg:col-span-8 bg-primary-container comic-card sketch-crosshatch p-5 sm:p-6 md:p-7 flex flex-col justify-between gap-4 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="min-h-10 inline-flex items-center gap-2 px-3 rounded-xl bg-surface text-on-surface border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)]">
              <span className="material-symbols-outlined text-base">
                account_balance_wallet
              </span>
              <h2 className="font-label-bold text-xs font-bold uppercase tracking-wider">
                Total Saldo Bersih
              </h2>
            </div>

            <Link
              href="/accounts"
              className="min-h-11 inline-flex items-center gap-1.5 px-4 rounded-xl bg-surface hover:bg-surface-bright text-on-surface border-2 border-outline text-xs sm:text-sm font-label-bold font-bold shadow-[2px_2px_0_0_var(--theme-outline)] active-press-sm transition-colors"
            >
              <span>Kelola Dompet</span>
            </Link>
          </div>

          <div className="my-1 sm:my-2">
            <p className="text-[clamp(2.25rem,5.2vw,3.75rem)] leading-[1.05] tracking-[-0.03em] font-display-lg font-extrabold text-on-primary-container break-words w-full tabular-nums">
              {balanceLoading || (budgetLoading && !budget) ? (
                <span className="animate-pulse opacity-50">Rp ...</span>
              ) : (
                formatIDR(coldBalance)
              )}
            </p>
          </div>

          <div className="bg-surface/95 border-2 border-outline/40 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs sm:text-sm leading-snug text-on-surface">
            <span className="flex items-center gap-1.5 text-on-surface-variant text-pretty">
              <span className="material-symbols-outlined text-base text-tertiary shrink-0">
                verified_user
              </span>
              <span>
                Aman dipakai (Sudah potong Hutang Jatuh Tempo, Pos Tetap & Tabungan)
              </span>
            </span>
            {!balanceLoading && (
              <span className="text-on-surface-variant font-medium whitespace-nowrap">
                Total Kas Riil:{" "}
                <strong className="font-bold text-on-surface tabular-nums">
                  {formatIDR(totalKas)}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Kartu 2: Roasting Keuangan AI */}
        <div className="col-span-12 lg:col-span-4 h-full min-h-[260px] bg-surface comic-card p-5 sm:p-6 flex flex-col relative">
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
        </div>

        {/* Kartu 3: Batas Belanja Hari Ini (Dual Quota Safe-To-Spend) */}
        <SafeToSpendCard
          budget={budget}
          dailyCheck={dailyCheck}
          loading={budgetLoading || loading}
        />

        {/* Kartu 4 (Kiri Bawah - 5 Kolom): Arus Kas & Pos Pengeluaran */}
        <div className="col-span-12 lg:col-span-5 bg-surface comic-card p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-headline-md text-lg text-on-surface font-extrabold">
              Arus Kas & Pos Pengeluaran
            </h2>
            <span className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant border-2 border-outline/40 font-label-bold font-bold text-xs shrink-0">
              Bulan Ini
            </span>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            {/* Kotak Pemasukan Bulan Ini */}
            <div className="bg-background border-2 border-outline/35 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-bold font-semibold text-xs sm:text-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-tertiary">
                    arrow_upward
                  </span>
                  <span>Pemasukan Bulan Ini</span>
                </span>
                <span className="font-display-lg text-base sm:text-lg font-extrabold text-tertiary dark:text-tertiary-fixed tabular-nums">
                  +{formatIDR(totalIncome)}
                </span>
              </div>
              <div className="h-3 w-full bg-surface-container-high border-2 border-outline/50 rounded-lg overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${incomePercent}%` }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-tertiary-container sketch-hatch"
                />
              </div>
            </div>

            {/* Kotak Total Pengeluaran */}
            <div className="bg-background border-2 border-outline/35 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-bold font-semibold text-xs sm:text-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-error">
                    arrow_downward
                  </span>
                  <span>Total Pengeluaran ({expenseToIncomeRatio}%)</span>
                </span>
                <span className="font-display-lg text-base sm:text-lg font-extrabold text-error tabular-nums">
                  -{formatIDR(totalExpense)}
                </span>
              </div>
              <div className="h-3 w-full bg-surface-container-high border-2 border-outline/50 rounded-lg overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${expensePercent}%` }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                  className="h-full bg-error-container sketch-hatch"
                />
              </div>
            </div>

            {/* Kotak Pos Terbesar */}
            <div className="bg-surface-container border-2 border-outline/35 rounded-xl p-3.5 space-y-2.5 flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-label-bold text-sm text-on-surface font-bold">
                  Pos Pengeluaran Terbesar
                </h3>
                <Link
                  href="/categories"
                  className="text-xs font-label-bold font-bold text-secondary hover:underline"
                >
                  Atur Pos &rarr;
                </Link>
              </div>

              {withSpending.length === 0 ? (
                <p className="text-sm text-on-surface-variant italic">
                  Belum ada pengeluaran yang tercatat di bulan ini.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-body-md text-on-surface-variant leading-relaxed">
                    {withSpending
                      .slice(0, 4)
                      .map(
                        ({ cat, spent }, idx) =>
                          `${idx + 1}. ${cat.name} (${formatIDR(spent)})`
                      )
                      .join(" • ")}
                  </p>
                  <div className="space-y-2 pt-1">
                    {withSpending.slice(0, 3).map(({ cat, spent }, idx) => {
                      const barColors = [
                        "bg-primary-container",
                        "bg-secondary-container",
                        "bg-tertiary-container",
                      ];
                      return (
                        <div key={cat.id} className="space-y-1">
                          <div className="flex justify-between text-xs font-label-bold font-semibold">
                            <span className="truncate text-on-surface">
                              {cat.name}
                            </span>
                            <span className="text-on-surface shrink-0 tabular-nums">
                              {formatIDR(spent)}
                            </span>
                          </div>
                          <div className="h-2.5 w-full bg-surface border border-outline/50 rounded-md overflow-hidden">
                            <div
                              className={`h-full ${barColors[idx % 3]} sketch-hatch`}
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
        </div>

        {/* Kartu 5 (Kanan Bawah - 7 Kolom): Transaksi Terbaru */}
        <div className="col-span-12 lg:col-span-7 bg-surface comic-card p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-headline-md text-lg text-on-surface font-extrabold">
              Transaksi Terbaru
            </h2>
            <Link
              className="font-label-bold font-bold text-xs sm:text-sm text-secondary hover:underline inline-flex items-center gap-1"
              href="/transactions"
            >
              <span>Lihat Semua Riwayat</span>
              <span className="material-symbols-outlined text-sm leading-none">
                arrow_forward
              </span>
            </Link>
          </div>

          <div className="flex flex-col gap-2.5 flex-1 justify-start">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t) => {
                const cat = categories.find((c) => c.id === t.categoryId || c.name === t.category);
                const isTransfer = t.type === "transfer";
                const isIncome = t.type === "income";

                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setEditTransaction(t);
                      setShowTransactionForm(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setEditTransaction(t);
                        setShowTransactionForm(true);
                      }
                    }}
                    className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border-2 border-outline/30 hover:border-outline bg-background hover:bg-surface-container transition-colors group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl border-2 border-outline/50 flex items-center justify-center shrink-0 ${
                          isIncome
                            ? "bg-tertiary-container text-on-tertiary-container"
                            : isTransfer
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-primary-container text-on-primary-container"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {getTransactionIcon({
                            type: t.type,
                            categoryIcon: cat?.icon,
                            categoryName: cat?.name || t.category,
                            note: t.note,
                            debtId: t.debtId,
                          })}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-label-bold text-sm text-on-surface font-bold truncate">
                          {t.note ||
                            (isTransfer
                              ? "Transfer Antar Akun"
                              : cat?.name || t.category || "Transaksi")}
                        </h3>
                        <p className="font-body-sm text-xs text-on-surface-variant truncate mt-0.5">
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
                      className={`font-display-lg text-sm sm:text-base font-extrabold whitespace-nowrap shrink-0 tabular-nums ${
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
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background border-2 border-dashed border-outline/50 rounded-xl text-on-surface-variant sketch-hatch">
                <span className="material-symbols-outlined text-3xl mb-1.5">
                  receipt_long
                </span>
                <p className="font-label-bold font-bold text-sm text-on-surface">
                  Belum ada transaksi di bulan ini
                </p>
                <p className="text-xs mt-1">
                  Ketuk tombol + biru di kanan bawah untuk mencatat transaksi.
                </p>
              </div>
            )}
          </div>
        </div>
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
