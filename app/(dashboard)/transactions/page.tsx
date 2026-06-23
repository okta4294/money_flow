"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { MonthSelector } from "@/components/layout/MonthSelector";
import { Transaction } from "@/lib/firestore/transactions";

export default function TransactionsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [showForm, setShowForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  const { transactions, loading, totalIncome, totalExpense } = useTransactions(year, month);

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  const handleEdit = (t: Transaction) => {
    setEditTransaction(t);
    setShowForm(true);
  };

  function formatRupiah(n: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
  }

  const budget = 5000000; // Hardcoded budget for now, we can fetch later if we have monthly budget global
  const spentPercent = Math.min((totalExpense / budget) * 100, 100);

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      {/* Search & Filter Top Row */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <input className="w-full py-4 pl-12 pr-4 bg-surface-container-lowest neo-brutalist-border rounded-xl font-body-md focus:ring-0 focus:outline-none focus:neo-brutalist-shadow transition-all duration-75" placeholder="Search transactions..." type="text"/>
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-background">search</span>
        </div>
        <div className="bg-surface-container neo-brutalist-border rounded-xl flex items-center justify-center p-1 neo-brutalist-shadow-sm h-full self-stretch">
          <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        </div>
      </div>

      {/* Insights Bento Section */}
      <section className="grid grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1 bg-primary-container neo-brutalist-border rounded-xl p-6 neo-brutalist-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 opacity-20 transform rotate-12 group-hover:rotate-45 transition-transform duration-500">
             <span className="material-symbols-outlined text-8xl text-on-primary-container">outbound</span>
          </div>
          <p className="font-label-bold text-on-primary-container uppercase mb-1">Total Spent</p>
          <p className="font-display-lg text-4xl text-on-primary-container tracking-tighter">{formatRupiah(totalExpense)}</p>
          <div className="mt-4 h-3 bg-white neo-brutalist-border rounded-full overflow-hidden">
            <div className="h-full bg-tertiary-container neo-brutalist-border border-l-0 border-t-0 border-b-0" style={{ width: `${spentPercent}%` }}></div>
          </div>
          <p className="font-body-md text-on-surface-variant mt-2">{Math.round(spentPercent)}% of basic limit</p>
        </div>
        
        <div className="col-span-2 md:col-span-1 bg-secondary-container neo-brutalist-border rounded-xl p-6 neo-brutalist-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-20 transform -rotate-12 group-hover:-rotate-45 transition-transform duration-500">
             <span className="material-symbols-outlined text-8xl text-on-secondary-container">call_received</span>
          </div>
          <p className="font-label-bold text-on-secondary-container uppercase mb-1">Total Income</p>
          <p className="font-display-lg text-4xl text-on-secondary-container tracking-tighter">{formatRupiah(totalIncome)}</p>
          
          <div className="mt-4 flex gap-2">
            {(["all", "income", "expense"] as const).map((f) => {
              const isSelected = filter === f;
              const labels = { all: "All", income: "In", expense: "Out" };
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-md font-label-bold text-sm uppercase transition-colors neo-brutalist-border ${
                    isSelected
                      ? "bg-primary-container text-on-primary-container neo-brutalist-shadow-sm active-press"
                      : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-bright"
                  }`}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* List */}
      <TransactionList
        transactions={filtered}
        loading={loading}
        onEdit={handleEdit}
      />

      {/* FAB */}
      <button
        id="add-transaction-fab"
        onClick={() => { setEditTransaction(null); setShowForm(true); }}
        className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-16 h-16 bg-primary-container neo-brutalist-border rounded-full neo-brutalist-shadow active-press z-50 flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-4xl text-on-background" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>

      <TransactionForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditTransaction(null); }}
        editData={editTransaction}
      />
    </div>
  );
}
