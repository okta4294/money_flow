"use client";

import { useState } from "react";
import { Plus, CreditCard, TrendingDown } from "lucide-react";
import { useDebts } from "@/hooks/useDebts";
import { Debt } from "@/lib/firestore/debts";
import { DebtForm } from "@/components/debts/DebtForm";
import { DebtList } from "@/components/debts/DebtList";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function DebtsPage() {
  const { debts, activeDebts, paidDebts, totalDebt, loading } = useDebts();
  const [showForm, setShowForm] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [filter, setFilter] = useState<"active" | "paid" | "all">("active");

  const handleEdit = (debt: Debt) => {
    setEditDebt(debt);
    setShowForm(true);
  };

  const filteredDebts =
    filter === "active" ? activeDebts : filter === "paid" ? paidDebts : debts;

  const totalPaid = debts.reduce((sum, d) => sum + d.paidAmount, 0);
  const totalOriginal = debts.reduce((sum, d) => sum + d.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Hutang & Paylater</h1>
          <p className="text-slate-400 text-sm mt-0.5">Pantau sisa tagihan Anda</p>
        </div>
        <button
          id="add-debt-btn"
          onClick={() => { setEditDebt(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02]"
        >
          <Plus size={16} />
          Tambah Hutang
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Sisa */}
        <div className="relative overflow-hidden bg-slate-900/50 border border-amber-500/20 rounded-2xl p-5">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500 rounded-full opacity-10 blur-2xl" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Total Sisa Hutang</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <CreditCard size={18} className="text-amber-400" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-32 bg-slate-800 rounded-lg animate-pulse" />
          ) : (
            <span className="text-2xl font-bold text-amber-400">{formatRupiah(totalDebt)}</span>
          )}
          <p className="text-slate-600 text-xs mt-1">{activeDebts.length} hutang aktif</p>
        </div>

        {/* Total Sudah Dibayar */}
        <div className="relative overflow-hidden bg-slate-900/50 border border-emerald-500/20 rounded-2xl p-5">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500 rounded-full opacity-10 blur-2xl" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Total Terbayar</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <TrendingDown size={18} className="text-emerald-400" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-32 bg-slate-800 rounded-lg animate-pulse" />
          ) : (
            <span className="text-2xl font-bold text-emerald-400">{formatRupiah(totalPaid)}</span>
          )}
          <p className="text-slate-600 text-xs mt-1">{paidDebts.length} hutang lunas</p>
        </div>

        {/* Total Semua Hutang */}
        <div className="relative overflow-hidden bg-slate-900/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-slate-500 rounded-full opacity-10 blur-2xl" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Total Semua Hutang</span>
            <div className="w-9 h-9 rounded-xl bg-slate-700/50 flex items-center justify-center">
              <CreditCard size={18} className="text-slate-400" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-32 bg-slate-800 rounded-lg animate-pulse" />
          ) : (
            <span className="text-2xl font-bold text-slate-300">{formatRupiah(totalOriginal)}</span>
          )}
          <p className="text-slate-600 text-xs mt-1">{debts.length} total hutang tercatat</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["active", "paid", "all"] as const).map((f) => (
          <button
            key={f}
            id={`debt-filter-${f}`}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              filter === f
                ? f === "active"
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : f === "paid"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-700 text-white border-slate-600"
                : "text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
            }`}
          >
            {f === "active" ? `Aktif (${activeDebts.length})` : f === "paid" ? `Lunas (${paidDebts.length})` : `Semua (${debts.length})`}
          </button>
        ))}
      </div>

      {/* Debt List */}
      <DebtList
        debts={filteredDebts}
        loading={loading}
        onEdit={handleEdit}
        filter={filter}
      />

      {/* Modals */}
      <DebtForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditDebt(null); }}
        editData={editDebt}
      />
    </div>
  );
}
