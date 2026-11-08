"use client";

import { useState, useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
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

  const expenseCount = useMemo(
    () => transactions.filter((t) => t.type === "expense").length,
    [transactions]
  );
  const incomeCount = useMemo(
    () => transactions.filter((t) => t.type === "income").length,
    [transactions]
  );

  const handleEdit = (t: Transaction) => {
    setEditTransaction(t);
    setShowForm(true);
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full">
      <PageHeader
        title="Riwayat Transaksi"
        subtitle="Lacak seluruh arus kemiskinan akun Anda per bulan."
        year={year}
        month={month}
        onMonthChange={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
        className="mb-0"
      />

      <div className="relative w-full min-w-0">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full py-3 pl-11 pr-10 bg-surface border-[3px] border-outline rounded-2xl font-body-md text-sm sm:text-base focus:ring-0 focus:outline-none shadow-[2px_2px_0_0_var(--theme-outline)] transition-all text-on-surface placeholder:text-on-surface-variant/70"
          placeholder="Cari catatan transaksi, kategori, atau akun dompet..."
          type="text"
        />
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
          search
        </span>
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 active-press cursor-pointer"
            aria-label="Hapus pencarian"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>

      {/* 2 Kartu Ringkasan: Kuning (Total Pengeluaran) & Hijau (Total Pemasukan) sesuai FigCraft Frame 05 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-primary-container border-[3px] border-outline rounded-2xl p-5 shadow-[4px_4px_0_0_var(--theme-outline)] relative overflow-hidden flex flex-col justify-between gap-2"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-label-bold text-on-primary-container uppercase text-xs font-extrabold tracking-wide">
              Total Pengeluaran Bulan Ini
            </p>
            <span className="material-symbols-outlined text-xl text-on-primary-container">
              trending_down
            </span>
          </div>
          <p className="font-display-lg text-3xl sm:text-4xl font-black text-on-primary-container tracking-tight">
            {formatRupiah(totalExpense)}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-tertiary-container border-[3px] border-outline rounded-2xl p-5 shadow-[4px_4px_0_0_var(--theme-outline)] relative overflow-hidden flex flex-col justify-between gap-2"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-label-bold text-on-tertiary-container uppercase text-xs font-extrabold tracking-wide">
              Total Pemasukan Bulan Ini
            </p>
            <span className="material-symbols-outlined text-xl text-on-tertiary-container">
              trending_up
            </span>
          </div>
          <p className="font-display-lg text-3xl sm:text-4xl font-black text-on-tertiary-container tracking-tight">
            {formatRupiah(totalIncome)}
          </p>
        </motion.div>
      </section>

      {/* Filter Tabs dengan Hitungan Transaksi sesuai FigCraft Frame 05 */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex gap-2.5 shrink-0">
          {(["all", "expense", "income"] as const).map((f) => {
            const isSelected = filter === f;
            const labels = {
              all: `Semua Mutasi (${transactions.length})`,
              expense: `Pengeluaran (${expenseCount})`,
              income: `Pemasukan (${incomeCount})`,
            };
            return (
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl font-label-bold text-xs uppercase tracking-wider transition-all border-2 border-outline active-press-sm cursor-pointer ${
                  isSelected
                    ? "bg-secondary-container text-on-secondary-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold"
                    : "bg-surface text-on-surface hover:bg-surface-bright"
                }`}
              >
                {labels[f]}
              </motion.button>
            );
          })}
        </div>
      </div>

      <TransactionList
        transactions={filtered}
        loading={loading}
        onEdit={handleEdit}
      />

      <FloatingActionButton
        id="add-transaction-fab"
        label="Tambah Transaksi"
        onClick={() => {
          setEditTransaction(null);
          setShowForm(true);
        }}
      />

      <TransactionForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditTransaction(null); }}
        editData={editTransaction}
      />
    </div>
  );
}
