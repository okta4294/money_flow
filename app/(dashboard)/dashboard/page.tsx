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
import { motion } from "framer-motion";

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
    <div className="flex flex-col flex-1 h-full max-w-[1440px] mx-auto w-full pb-8">
      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-end mb-6">
        <div>
          <h2 className="font-headline-lg font-bold text-slate-900 dark:text-primary-fixed tracking-tight">Overview</h2>
          <p className="font-body-md text-slate-500 dark:text-on-surface-variant">Ringkasan keuangan anda</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white dark:bg-surface-container-high rounded-lg p-1 border border-slate-200 dark:border-transparent">
            <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
          </div>
          <button
            id="set-initial-balance-btn"
            onClick={() => setShowBalanceModal(true)}
            className="flex items-center gap-2 bg-white dark:bg-surface-container-highest px-4 py-2 rounded-lg text-slate-700 dark:text-on-surface font-label-md border border-slate-200 dark:border-outline-variant/30 hover:bg-slate-50 dark:hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Saldo Awal
          </button>
        </div>
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-12 gap-6 w-full">
        
        {/* Total Balance & Quick Stats Row */}
        <div className="col-span-12 lg:col-span-8">
          <SummaryCards
            initialBalance={initialBalance}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            loading={loading || balanceLoading}
          />
        </div>

        {/* AI Financial Roaster */}
        <div className="col-span-12 lg:col-span-4 h-full min-h-[300px]">
          {(!loading && !balanceLoading) ? (
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
          ) : (
            <div className="bg-white dark:glass-panel border border-slate-200 dark:border-white/5 rounded-xl p-6 h-full w-full animate-pulse flex flex-col">
              <div className="h-8 w-40 bg-slate-100 dark:bg-surface-bright rounded mb-6"></div>
              <div className="flex-1 space-y-4">
                <div className="h-4 w-full bg-slate-100 dark:bg-surface-bright rounded"></div>
                <div className="h-4 w-full bg-slate-100 dark:bg-surface-bright rounded"></div>
                <div className="h-4 w-3/4 bg-slate-100 dark:bg-surface-bright rounded"></div>
              </div>
            </div>
          )}
        </div>

        {/* Charts Row */}
        <div className="col-span-12">
          <SpendingChart transactions={transactions} categories={categories} />
        </div>

        {/* Recent Transactions Table */}
        <div className="col-span-12 bg-white dark:glass-panel border border-slate-200 dark:border-white/5 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-xl font-bold text-slate-900 dark:text-on-surface">Recent Transactions</h3>
            <a href="/transactions" className="font-label-md text-emerald-600 dark:text-primary-fixed hover:underline flex items-center gap-1 transition-colors">
              View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>
          <TransactionList
            transactions={recentTransactions}
            loading={loading}
            onEdit={handleEdit}
            variant="table"
          />
        </div>

      </div>

      {/* FAB */}
      <button
        id="add-transaction-fab"
        onClick={() => { setEditTransaction(null); setShowTransactionForm(true); }}
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-emerald-500 dark:bg-primary-fixed-dim hover:bg-emerald-600 dark:hover:bg-primary-container rounded-full shadow-lg shadow-emerald-500/30 dark:shadow-[0_0_20px_rgba(0,220,229,0.3)] flex items-center justify-center text-white dark:text-on-primary-container transition-transform hover:scale-105 z-40"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
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
