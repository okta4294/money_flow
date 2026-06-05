"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useDebts } from "@/hooks/useDebts";
import { getInitialBalance } from "@/lib/firestore/balances";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { InitialBalanceModal } from "@/components/dashboard/InitialBalanceModal";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { MonthSelector } from "@/components/layout/MonthSelector";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { Transaction } from "@/lib/firestore/transactions";
import { Plus, Pencil } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { transactions, loading, totalIncome, totalExpense } = useTransactions(year, month);
  
  // Ambil data bulan sebelumnya untuk AI Roasting
  const prevDate = new Date(year, month - 2);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  const { 
    transactions: prevTransactions, 
    totalIncome: prevTotalIncome, 
    totalExpense: prevTotalExpense 
  } = useTransactions(prevYear, prevMonth);

  const { categories } = useCategories();
  const { activeDebts, totalDebt } = useDebts();

  const [initialBalance, setInitialBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    setBalanceLoading(true);
    const bal = await getInitialBalance(user.uid, year, month);
    setInitialBalance(bal);
    setBalanceLoading(false);
  }, [user, year, month]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleEdit = (t: Transaction) => {
    setEditTransaction(t);
    setShowTransactionForm(true);
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Ringkasan kemiskinan anda</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
          <button
            id="set-initial-balance-btn"
            onClick={() => setShowBalanceModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-all border border-slate-200 dark:border-slate-700"
          >
            <Pencil size={13} />
            Saldo Awal
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        initialBalance={initialBalance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        loading={loading || balanceLoading}
      />

      {/* AI Roasting Summary */}
      {!loading && !balanceLoading && (
        <AISummaryCard
          transactions={transactions}
          month={month}
          year={year}
          initialBalance={initialBalance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          activeDebts={activeDebts}
          totalDebt={totalDebt}
          prevMonthData={{
            month: prevMonth,
            year: prevYear,
            transactions: prevTransactions,
            totalIncome: prevTotalIncome,
            totalExpense: prevTotalExpense,
          }}
        />
      )}

      {/* Charts */}
      <SpendingChart transactions={transactions} categories={categories} />

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-900 dark:text-white font-semibold text-sm">Transaksi Terbaru</h2>
          <a href="/transactions" className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 text-xs font-medium transition-colors">
            Lihat semua →
          </a>
        </div>
        <TransactionList
          transactions={recentTransactions}
          loading={loading}
          onEdit={handleEdit}
        />
      </div>

      {/* FAB */}
      <button
        id="add-transaction-fab"
        onClick={() => { setEditTransaction(null); setShowTransactionForm(true); }}
        className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-200 z-20"
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* Modals */}
      <InitialBalanceModal
        open={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        currentBalance={initialBalance}
        year={year}
        month={month}
        onSaved={fetchBalance}
      />
      <TransactionForm
        open={showTransactionForm}
        onClose={() => { setShowTransactionForm(false); setEditTransaction(null); }}
        editData={editTransaction}
      />
    </div>
  );
}
