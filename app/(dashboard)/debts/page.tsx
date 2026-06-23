"use client";

import { useState } from "react";
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
  const { debts, activeDebts, paidDebts, totalDebt, loading, nextMonthDebtEstimate } = useDebts();
  const [showForm, setShowForm] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [filter, setFilter] = useState<"active" | "paid" | "all">("active");

  const handleEdit = (debt: Debt) => {
    setEditDebt(debt);
    setShowForm(true);
  };

  const filteredDebts =
    filter === "active" ? activeDebts : filter === "paid" ? paidDebts : debts;

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hero Section: Total Debt */}
        <section className="col-span-1 md:col-span-2 bg-tertiary-container neo-brutalist-border rounded-lg p-6 neo-brutalist-shadow relative overflow-hidden">
          <div className="relative z-10">
            <p className="font-label-bold text-on-tertiary-container uppercase tracking-widest mb-2">Total Beban Hidup</p>
            <h2 className="font-display-lg text-4xl md:text-5xl text-on-tertiary-container tracking-tighter">
               {loading ? "..." : formatRupiah(totalDebt)}
            </h2>
            <div className="mt-6 flex gap-4">
              <div className="bg-surface neo-brutalist-border rounded-full px-4 py-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">warning</span>
                <span className="font-label-bold text-on-surface">{activeDebts.length} Active Debts</span>
              </div>
            </div>
          </div>
          {/* Decorative Element */}
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] text-on-tertiary-container opacity-10 rotate-12 pointer-events-none">account_balance</span>
        </section>

        {/* Next Month Estimate Card */}
        <section className="col-span-1 bg-surface-container neo-brutalist-border rounded-lg p-6 neo-brutalist-shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
             <span className="material-symbols-outlined text-error">calendar_month</span>
             <p className="font-label-bold text-on-surface-variant uppercase tracking-widest text-xs">Estimasi Bulan Depan</p>
          </div>
          <h3 className="font-headline-md text-2xl text-on-background">{loading ? "..." : formatRupiah(nextMonthDebtEstimate || 0)}</h3>
          <p className="text-xs font-body-md text-on-surface-variant mt-2 leading-relaxed">Tagihan yang jatuh tempo di bulan depan.</p>
        </section>
      </div>

      {/* Debt Categories Tabs */}
      <section className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {(["all", "active", "paid"] as const).map((f) => {
           const isSelected = filter === f;
           const label = f === "active" ? `Active` : f === "paid" ? `Paid` : `All Debts`;
           return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-full font-label-bold whitespace-nowrap neo-brutalist-border transition-all ${
                isSelected 
                  ? "bg-primary-container text-on-primary-container neo-brutalist-shadow-sm active-press"
                  : "bg-surface text-on-background hover:bg-surface-bright active-press"
              }`}
            >
              {label}
            </button>
           );
        })}
      </section>

      {/* Debt List Grid */}
      <DebtList
        debts={filteredDebts}
        loading={loading}
        onEdit={handleEdit}
        filter={filter}
      />
      
      {/* Motivation Quote Section */}
      <section className="bg-surface-container-high neo-brutalist-border rounded-lg p-6 border-dashed text-center mt-10">
        <p className="italic font-body-md text-on-surface-variant">"Hutang adalah cara masa depan meminjam uang dari masa sekarang, dan biasanya masa depan lupa balikin."</p>
      </section>

      {/* Modals */}
      <DebtForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditDebt(null); }}
        editData={editDebt}
      />
      
      {/* Floating Action Button */}
      <button
        onClick={() => { setEditDebt(null); setShowForm(true); }}
        className="fixed right-6 bottom-24 md:right-12 md:bottom-12 w-16 h-16 bg-primary-container neo-brutalist-border rounded-full neo-brutalist-shadow active-press z-50 flex items-center justify-center group"
      >
        <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform duration-300">add</span>
      </button>
    </div>
  );
}
