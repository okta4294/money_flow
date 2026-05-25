"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { MonthSelector } from "@/components/layout/MonthSelector";
import { Transaction } from "@/lib/firestore/transactions";
import { Plus } from "lucide-react";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Transaksi</h1>
          <p className="text-slate-400 text-sm mt-0.5">Semua catatan pemasukan & pengeluaran</p>
        </div>
        <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Pemasukan</p>
          <p className="text-emerald-400 font-bold text-base">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-1">Total Pengeluaran</p>
          <p className="text-rose-400 font-bold text-base">{formatRupiah(totalExpense)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "income", "expense"] as const).map((f) => (
          <button
            key={f}
            id={`filter-${f}`}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              filter === f
                ? f === "income"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : f === "expense"
                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  : "bg-slate-700 text-white border-slate-600"
                : "text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
			}`}
          >
            {f === "all" ? "Semua" : f === "income" ? "Pemasukan" : "Pengeluaran"}
          </button>
        ))}
        <span className="ml-auto text-slate-500 text-sm self-center">
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
        id="add-transaction-fab-transactions"
        onClick={() => { setEditTransaction(null); setShowForm(true); }}
        className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-200 z-20"
      >
        <Plus size={24} className="text-white" />
      </button>

      <TransactionForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditTransaction(null); }}
        editData={editTransaction}
      />
    </div>
  );
}
