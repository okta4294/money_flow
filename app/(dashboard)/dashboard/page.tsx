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
      <header className="glass-panel rounded-2xl sticky top-4 z-40 w-full justify-between items-center h-20 px-margin-desktop mb-6 hidden md:flex">
        <div className="flex-1">
          <h2 className="font-headline-lg text-headline-lg text-transparent bg-clip-text bg-gradient-to-r from-white to-primary-fixed/70 font-bold tracking-tight">Overview</h2>
        </div>
        <div className="flex items-center gap-stack-md">
          <div className="flex items-center glass-panel rounded-lg p-1 border border-white/10">
            <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
          </div>
          <button
            id="set-initial-balance-btn"
            onClick={() => setShowBalanceModal(true)}
            className="border border-primary-fixed/30 text-primary-fixed font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-primary-fixed/10 hover:shadow-[0_0_15px_rgba(99,247,255,0.2)] transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-pencil text-sm"></i>
            Saldo Awal
          </button>
        </div>
      </header>

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
            <div className="glass-panel rounded-2xl p-stack-lg h-full w-full animate-pulse flex flex-col">
              <div className="h-8 w-40 bg-surface-bright rounded mb-6"></div>
              <div className="flex-1 space-y-4">
                <div className="h-4 w-full bg-surface-bright rounded"></div>
                <div className="h-4 w-full bg-surface-bright rounded"></div>
                <div className="h-4 w-3/4 bg-surface-bright rounded"></div>
              </div>
            </div>
          )}
        </div>

        {/* Charts Row */}
        <div className="col-span-12">
          <SpendingChart transactions={transactions} categories={categories} />
        </div>

        {/* Recent Transactions Table */}
        <div className="col-span-12 mt-4 glass-panel rounded-2xl p-stack-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-headline-md text-white">Recent Transactions</h3>
            <a href="/transactions" className="text-primary-fixed font-label-md text-label-md hover:underline drop-shadow-[0_0_5px_rgba(99,247,255,0.4)] flex items-center gap-1 transition-colors">
              View All <i className="fa-solid fa-arrow-right text-sm"></i>
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
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-gradient-to-r from-secondary-container to-primary-fixed rounded-full shadow-[0_0_20px_rgba(96,1,209,0.5)] flex items-center justify-center text-white transition-transform hover:scale-105 z-40 border border-white/20"
      >
        <i className="fa-solid fa-plus text-2xl"></i>
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
