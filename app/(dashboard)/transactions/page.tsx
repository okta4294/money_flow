"use client";

import { useState, useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { Transaction } from "@/lib/firestore/transactions";
import { formatRupiah } from "@/lib/utils";

export default function TransactionsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filter, setFilter] = useState<"all" | "income" | "expense" | "transfer">("all");
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
  const transferCount = useMemo(
    () => transactions.filter((t) => t.type === "transfer").length,
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
          aria-label="Cari catatan transaksi, kategori, atau akun dompet"
          className="w-full py-3 pl-11 pr-10 bg-surface border-2 border-outline rounded-2xl font-body-md text-sm sm:text-base focus:ring-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus:border-secondary shadow-[2px_2px_0_0_var(--theme-outline)] transition-all text-on-surface placeholder:text-on-surface-variant/70"
          placeholder="Cari catatan transaksi, kategori, atau akun dompet..."
          type="text"
        />
        <span aria-hidden="true" className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
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

      {/* 2 Kartu Ringkasan Semantik: Pengeluaran & Pemasukan */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <div className="bg-error-container/15 border-2 border-outline rounded-2xl p-5 shadow-[3px_3px_0_0_var(--theme-outline)] relative overflow-hidden flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-label-bold text-on-surface-variant uppercase text-xs font-bold tracking-wide">
              Total Pengeluaran Bulan Ini
            </p>
            <span className="w-8 h-8 rounded-lg bg-error-container text-on-error-container border border-outline/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">
                trending_down
              </span>
            </span>
          </div>
          <p className="font-display-lg text-3xl sm:text-4xl font-extrabold text-error tracking-tight tabular-nums">
            {formatRupiah(totalExpense)}
          </p>
        </div>

        <div className="bg-tertiary-container/15 border-2 border-outline rounded-2xl p-5 shadow-[3px_3px_0_0_var(--theme-outline)] relative overflow-hidden flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-label-bold text-on-surface-variant uppercase text-xs font-bold tracking-wide">
              Total Pemasukan Bulan Ini
            </p>
            <span className="w-8 h-8 rounded-lg bg-tertiary-container text-on-tertiary-container border border-outline/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">
                trending_up
              </span>
            </span>
          </div>
          <p className="font-display-lg text-3xl sm:text-4xl font-extrabold text-tertiary dark:text-tertiary-fixed tracking-tight tabular-nums">
            {formatRupiah(totalIncome)}
          </p>
        </div>
      </section>

      {/* Filter Tabs dengan Warna Semantik */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex gap-2.5 shrink-0">
          {(["all", "expense", "income", "transfer"] as const).map((f) => {
            const isSelected = filter === f;
            const labels = {
              all: `Semua Mutasi (${transactions.length})`,
              expense: `Pengeluaran (${expenseCount})`,
              income: `Pemasukan (${incomeCount})`,
              transfer: `Transfer (${transferCount})`,
            };
            const activeColors = {
              all: "bg-primary-container text-on-primary-container",
              expense: "bg-error-container text-on-error-container",
              income: "bg-tertiary-container text-on-tertiary-container",
              transfer: "bg-secondary-container text-on-secondary-container",
            };
            return (
              <button
                type="button"
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl font-label-bold text-xs tracking-wide transition-all border-2 active-press-sm cursor-pointer ${
                  isSelected
                    ? `${activeColors[f]} border-outline shadow-[2px_2px_0_0_var(--theme-outline)] font-bold`
                    : "bg-surface text-on-surface-variant border-outline/40 hover:border-outline hover:text-on-surface"
                }`}
              >
                {labels[f]}
              </button>
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
