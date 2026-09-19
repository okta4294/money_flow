"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useDebts } from "@/hooks/useDebts";
import { getInitialBalance } from "@/lib/firestore/balances";
import { InitialBalanceModal } from "@/components/dashboard/InitialBalanceModal";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { MonthSelector } from "@/components/layout/MonthSelector";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { Transaction } from "@/lib/firestore/transactions";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { transactions, loading, totalIncome, totalExpense } = useTransactions(year, month);
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
  }, [user?.uid, year, month]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const currentBalance = initialBalance + totalIncome - totalExpense;
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

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="font-display-lg text-4xl md:text-5xl text-on-surface tracking-tighter uppercase">OVERVIEW</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Hai miskin gimana kabarnya.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
          <div className="bg-surface-container border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] flex items-center justify-center p-1 rounded-xl flex-1 sm:flex-initial">
             <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
          </div>
          <button
            onClick={() => setShowBalanceModal(true)}
            className="bg-primary-container text-on-primary-container font-label-bold text-label-bold uppercase py-2.5 px-4 border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] active-press rounded-xl transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-black font-bold text-lg">edit</span>
            Saldo Awal
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 w-full">
        <motion.div whileHover={{ scale: 1.02, y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="col-span-12 lg:col-span-8 bg-primary-container border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden group rounded-3xl">
          <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12 pointer-events-none">
            <span className="material-symbols-outlined text-[200px] text-on-primary-container">attach_money</span>
          </div>
          <div className="relative z-10">
            <div className="inline-block bg-on-background text-surface font-label-bold text-label-bold uppercase px-3 py-1 rounded-full border-2 border-outline mb-4">
                Total Liquid Assets
            </div>
            <h3 className="text-[clamp(2.5rem,5vw,4.5rem)] leading-none tracking-tight mt-2 font-display-lg break-words w-full" style={{ color: 'var(--theme-primary)', WebkitTextStroke: '2px var(--theme-outline)' }}>
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(currentBalance)}
            </h3>
          </div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="col-span-12 lg:col-span-4 h-full min-h-[300px] bg-tertiary-container border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] p-6 flex flex-col relative rounded-3xl">
           <div className="absolute -top-4 -right-4 w-12 h-12 bg-background rounded-2xl border-2 border-outline flex items-center justify-center z-20 shadow-[2px_2px_0_0_var(--theme-outline)]">
              <span className="material-symbols-outlined text-on-background text-2xl">insights</span>
           </div>
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
            />
           ) : (
              <div className="animate-pulse flex flex-col h-full space-y-4 pt-4">
                  <div className="h-4 w-full bg-surface-bright rounded"></div>
                  <div className="h-4 w-full bg-surface-bright rounded"></div>
                  <div className="h-4 w-3/4 bg-surface-bright rounded"></div>
              </div>
           )}
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="col-span-12 lg:col-span-6 bg-surface-container border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] flex flex-col rounded-3xl overflow-hidden">
          <div className="bg-secondary-container border-b-[3px] border-outline px-6 py-4 flex justify-between items-center">
            <h4 className="font-headline-md text-xl text-on-secondary-container uppercase font-bold" style={{ WebkitTextStroke: '0.5px var(--theme-outline)' }}>Cash Flow</h4>
            <span className="font-label-bold text-label-bold text-on-secondary-container opacity-90 px-3 py-1 bg-surface-container/20 rounded-full border-2 border-outline">This Month</span>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center gap-8">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="font-label-bold text-label-bold text-on-surface uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-tertiary dark:text-tertiary-fixed">arrow_upward</span> Pemasukan
                </span>
                <span className="text-2xl font-display-lg text-tertiary dark:text-tertiary-fixed" style={{ WebkitTextStroke: '1px var(--theme-outline)' }}>
                   {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalIncome)}
                </span>
              </div>
              <div className="h-8 w-full bg-on-background border-2 border-outline rounded-full relative overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${incomePercent}%` }} transition={{ duration: 1, type: "spring" }} className="absolute top-0 left-0 h-full bg-tertiary-container border-r-[3px] border-outline"></motion.div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="font-label-bold text-label-bold text-on-surface uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-error">arrow_downward</span> Pengeluaran
                </span>
                <span className="text-2xl font-display-lg text-error" style={{ WebkitTextStroke: '1px var(--theme-outline)' }}>
                   {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalExpense)}
                </span>
              </div>
              <div className="h-8 w-full bg-on-background border-2 border-outline rounded-full relative overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${expensePercent}%` }} transition={{ duration: 1, type: "spring", delay: 0.2 }} className="absolute top-0 left-0 h-full bg-error-container border-r-[3px] border-outline"></motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="col-span-12 lg:col-span-6 bg-surface-container border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] flex flex-col overflow-hidden">
          <div className="bg-primary-container border-2 border-outline border-l-0 border-r-0 border-t-0 px-6 py-3 flex justify-between items-center">
            <h4 className="font-headline-md text-xl text-on-primary-container uppercase font-bold">Budget Heat</h4>
          </div>
          <div className="p-6 flex flex-col gap-6 flex-1 justify-start max-h-[300px] overflow-y-auto no-scrollbar">
             {withSpending.length === 0 ? (
               <p className="text-on-surface-variant text-center text-sm">Belum ada pengeluaran bulan ini.</p>
             ) : (
               withSpending.map(({ cat, spent }, idx) => {
                 const colors = ['bg-tertiary-container', 'bg-secondary-container', 'bg-primary-container'];
                 return (
                   <div key={cat.id} className="flex items-center gap-4">
                     <div className={`w-12 h-12 ${colors[idx % 3]} border-2 border-outline flex items-center justify-center shrink-0`}>
                       {cat.icon?.includes("fa-") ? (
                         <i className={`fa-solid ${cat.icon} text-black text-xl`}></i>
                       ) : (
                         <span className="material-symbols-outlined text-black">{cat.icon || 'category'}</span>
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-baseline mb-1 gap-2">
                         <span className="font-label-bold text-label-bold text-on-surface uppercase truncate">{cat.name}</span>
                         <span className="font-body-md text-sm text-on-surface font-bold whitespace-nowrap shrink-0">
                           {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(spent)}
                         </span>
                       </div>
                       <div className="h-4 w-full bg-on-background border-2 border-outline relative">
                         <div className={`absolute top-0 left-0 h-full ${colors[idx % 3]} border-2 border-outline border-l-0 border-t-0 border-b-0 transition-all duration-500`} style={{ width: `${(spent / maxSpent) * 100}%` }}></div>
                       </div>
                     </div>
                   </div>
                 );
               })
             )}
             {categories.length === 0 && <p className="text-on-surface-variant text-center">No categories found.</p>}
          </div>
        </div>

        <div className="col-span-12 bg-surface-container border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] overflow-hidden mb-12">
          <div className="border-2 border-outline border-t-0 border-l-0 border-r-0 px-6 py-4 flex justify-between items-center bg-surface-variant">
            <h4 className="font-headline-md text-xl text-on-surface uppercase font-bold">Recent Hits</h4>
            <Link className="font-label-bold text-label-bold text-primary-fixed hover:underline flex items-center" href="/transactions">
               View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
          <div className="flex flex-col">
            {recentTransactions.length > 0 ? recentTransactions.map((t) => {
               const cat = categories.find(c => c.id === t.categoryId);
               const isTransfer = t.type === "transfer";
               const isIncome = t.type === "income";

               return (
                <div key={t.id} onClick={() => { setEditTransaction(t); setShowTransactionForm(true); }} className="flex items-center justify-between p-4 md:p-6 border-2 border-outline border-t-0 border-l-0 border-r-0 hover:bg-surface-bright transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-on-background border-2 border-outline flex items-center justify-center transition-colors ${
                      isIncome
                        ? "group-hover:bg-tertiary-container"
                        : isTransfer
                        ? "group-hover:bg-secondary-container"
                        : "group-hover:bg-error-container"
                    }`}>
                      {isTransfer ? (
                        <span className="material-symbols-outlined text-surface group-hover:text-on-background transition-colors">swap_horiz</span>
                      ) : cat?.icon?.includes("fa-") ? (
                        <i className={`fa-solid ${cat.icon} text-surface group-hover:text-on-background text-xl transition-colors`}></i>
                      ) : (
                        <span className="material-symbols-outlined text-surface group-hover:text-on-background transition-colors">{cat?.icon || 'receipt'}</span>
                      )}
                    </div>
                    <div>
                      <h5 className="font-label-bold text-label-bold text-on-background line-clamp-1">
                        {t.note || (isTransfer ? "Transfer" : cat?.name || t.category || "Transaction")}
                      </h5>
                      <span className="font-body-md text-sm text-on-background/70">
                        {isTransfer
                          ? `${t.accountName || "?"} → ${t.destinationAccountName || "?"}`
                          : (cat?.name || "Uncategorized")
                        } • {new Date(t.date + "T00:00:00").toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <span className={`font-headline-md text-lg md:text-xl font-bold whitespace-nowrap ${
                    isIncome
                      ? 'text-tertiary dark:text-tertiary-fixed'
                      : isTransfer
                      ? 'text-secondary-fixed-dim'
                      : 'text-error dark:text-error-fixed'
                  }`}>
                    {isIncome ? '+' : isTransfer ? '' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(t.amount)}
                  </span>
                </div>
               );
            }) : (
              <div className="p-8 text-center text-on-surface-variant">No transactions this month.</div>
            )}
          </div>
        </div>

      </div>

      <motion.button
        id="add-transaction-fab"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { setEditTransaction(null); setShowTransactionForm(true); }}
        className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-16 h-16 bg-secondary-container text-on-secondary-container border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] flex items-center justify-center z-40 rounded-full"
      >
        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </motion.button>

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
    </>
  );
}
