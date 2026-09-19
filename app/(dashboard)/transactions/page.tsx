"use client";

import { useState, useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { MonthSelector } from "@/components/layout/MonthSelector";
import { Transaction } from "@/lib/firestore/transactions";
import { motion } from "framer-motion";
import { formatRupiah } from "@/lib/utils";

export default function TransactionsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  const { transactions, loading, totalIncome, totalExpense } = useTransactions(year, month);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => filter === "all" || t.type === filter)
      .filter((t) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          t.note?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.accountName?.toLowerCase().includes(q) ||
          t.destinationAccountName?.toLowerCase().includes(q)
        );
      });
  }, [transactions, filter, search]);

  const handleEdit = (t: Transaction) => {
    setEditTransaction(t);
    setShowForm(true);
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 w-full">
        <div className="relative flex-1 w-full min-w-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-3.5 pl-11 pr-10 bg-surface-container-lowest border-2 border-outline rounded-2xl font-body-md text-sm sm:text-base focus:ring-0 focus:outline-none shadow-[2px_2px_0_0_var(--theme-outline)] transition-all text-on-surface placeholder:text-on-surface-variant/60"
            placeholder="Cari transaksi..."
            type="text"
          />
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 active-press"
              aria-label="Hapus pencarian"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>
        <div className="bg-surface-container border-2 border-outline rounded-2xl flex items-center justify-center p-1 shadow-[2px_2px_0_0_var(--theme-outline)] shrink-0 self-center sm:self-auto">
          <MonthSelector year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} className="col-span-2 md:col-span-1 bg-primary-container border-2 border-outline rounded-2xl p-5 sm:p-6 shadow-[4px_4px_0_0_var(--theme-outline)] relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute -right-6 -top-6 opacity-20 pointer-events-none rotate-12">
             <span className="material-symbols-outlined text-8xl text-on-primary-container">outbound</span>
          </div>
          <div>
            <p className="font-label-bold text-on-primary-container uppercase mb-1 text-xs sm:text-sm">Total Pengeluaran</p>
            <p className="font-display-lg text-3xl sm:text-4xl text-on-primary-container tracking-tighter" style={{ WebkitTextStroke: '1px var(--theme-outline)' }}>{formatRupiah(totalExpense)}</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="bg-surface border-2 border-outline rounded-full px-3 py-1 text-xs font-label-bold text-on-surface flex items-center gap-1.5 shadow-[2px_2px_0_0_var(--theme-outline)]">
              <span className="material-symbols-outlined text-sm text-error">trending_down</span>
              Cashflow Keluar
            </span>
          </div>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }} className="col-span-2 md:col-span-1 bg-secondary-container border-2 border-outline rounded-2xl p-5 sm:p-6 shadow-[4px_4px_0_0_var(--theme-outline)] relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute -right-6 -bottom-6 opacity-20 pointer-events-none -rotate-12">
             <span className="material-symbols-outlined text-8xl text-on-secondary-container">call_received</span>
          </div>
          <div>
            <p className="font-label-bold text-on-secondary-container uppercase mb-1 text-xs sm:text-sm">Total Pemasukan</p>
            <p className="font-display-lg text-3xl sm:text-4xl text-on-secondary-container tracking-tighter" style={{ WebkitTextStroke: '1px var(--theme-outline)' }}>{formatRupiah(totalIncome)}</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="bg-surface border-2 border-outline rounded-full px-3 py-1 text-xs font-label-bold text-on-surface flex items-center gap-1.5 shadow-[2px_2px_0_0_var(--theme-outline)]">
              <span className="material-symbols-outlined text-sm text-tertiary">trending_up</span>
              Cashflow Masuk
            </span>
          </div>
        </motion.div>
      </section>

      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex gap-2 shrink-0">
          {(["all", "income", "expense"] as const).map((f) => {
            const isSelected = filter === f;
            const labels = { all: "Semua", income: "Pemasukan", expense: "Pengeluaran" };
            return (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl font-label-bold text-xs uppercase tracking-wider transition-all border-2 border-outline active-press ${
                  isSelected
                    ? "bg-primary-container text-on-primary-container shadow-[2px_2px_0_0_var(--theme-outline)]"
                    : "bg-surface text-on-surface-variant hover:bg-surface-bright"
                }`}
              >
                {labels[f]}
              </motion.button>
            );
          })}
        </div>
        <span className="text-xs font-label-bold text-on-surface-variant shrink-0">
          {filtered.length} Transaksi
        </span>
      </div>

      <TransactionList
        transactions={filtered}
        loading={loading}
        onEdit={handleEdit}
      />

      <motion.button
        id="add-transaction-fab"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { setEditTransaction(null); setShowForm(true); }}
        className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-16 h-16 bg-primary-container neo-brutalist-border rounded-full neo-brutalist-shadow z-50 flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-4xl text-on-background" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </motion.button>

      <TransactionForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditTransaction(null); }}
        editData={editTransaction}
      />
    </div>
  );
}
