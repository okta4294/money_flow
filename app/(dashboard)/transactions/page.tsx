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

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-primary-fixed/70">Transaksi</h2>
          <p className="font-body-md text-on-surface-variant mt-1">Semua catatan pemasukan & pengeluaran</p>
        </div>
        <div className="flex items-center gap-2 glass-panel rounded-full p-1 self-start md:self-auto border border-white/5">
          <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel rounded-xl p-4 border-t border-t-primary-container/30 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-fixed-dim/10 rounded-full blur-2xl"></div>
          <p className="font-label-sm text-on-surface-variant mb-1 relative z-10">Total Pemasukan</p>
          <p className="font-headline-md font-bold text-primary-fixed-dim drop-shadow-[0_0_10px_rgba(0,220,229,0.5)] relative z-10">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="glass-panel rounded-xl p-4 border-t border-t-error/30 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-error/10 rounded-full blur-2xl"></div>
          <p className="font-label-sm text-on-surface-variant mb-1 relative z-10">Total Pengeluaran</p>
          <p className="font-headline-md font-bold text-error drop-shadow-[0_0_10px_rgba(255,180,171,0.5)] relative z-10">{formatRupiah(totalExpense)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between overflow-x-auto pb-2 no-scrollbar">
        <div className="flex gap-2">
          {(["all", "income", "expense"] as const).map((f) => {
            const isSelected = filter === f;
            const labels = { all: "Semua", income: "Pemasukan", expense: "Pengeluaran" };
            return (
              <button
                key={f}
                id={`filter-${f}`}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full font-label-md transition-colors border whitespace-nowrap ${
                  isSelected
                    ? "bg-secondary-container/80 text-on-secondary-container border-secondary-container/50 shadow-[0_0_12px_rgba(96,1,209,0.4)]"
                    : "glass-panel border-white/5 text-on-surface-variant hover:text-white"
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
        <span className="font-label-sm text-on-surface-variant whitespace-nowrap ml-4">
          {filtered.length} transaksi
        </span>
      </div>

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
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-gradient-to-r from-secondary-container to-primary-fixed rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(96,1,209,0.5)] hover:scale-105 transition-all z-40 border border-white/20 text-white"
      >
        <i className="fa-solid fa-plus text-2xl"></i>
      </button>

      <TransactionForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditTransaction(null); }}
        editData={editTransaction}
      />
    </div>
  );
}
