"use client";

import { useState } from "react";
import { useDebts } from "@/hooks/useDebts";
import { Debt } from "@/lib/firestore/debts";
import { DebtForm } from "@/components/debts/DebtForm";
import { DebtList } from "@/components/debts/DebtList";
import { motion } from "framer-motion";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function DebtsPage() {
  const { debts, activeDebts, paidDebts, totalDebt, loading, upcomingMonths } = useDebts();
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
        <motion.section whileHover={{ scale: 1.02, y: -2 }} className="col-span-1 md:col-span-2 bg-tertiary-container border-4 border-outline rounded-3xl p-6 shadow-[4px_4px_0_0_var(--theme-outline)] relative overflow-hidden">
          <div className="relative z-10">
            <p className="font-label-bold text-on-tertiary-container uppercase tracking-widest mb-2 font-bold">Total Beban Hidup</p>
            <h2 className="text-4xl md:text-5xl tracking-tighter text-outline font-display-lg" style={{ color: 'var(--theme-on-tertiary-container)', WebkitTextStroke: '2px var(--theme-outline)' }}>
               {loading ? "..." : formatRupiah(totalDebt)}
            </h2>
            <div className="mt-6 flex gap-4">
              <div className="bg-surface border-2 border-outline rounded-full px-4 py-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">warning</span>
                <span className="font-label-bold text-on-surface">{activeDebts.length} Active Debts</span>
              </div>
            </div>
          </div>
          {/* Decorative Element */}
          <motion.span animate={{ rotate: [12, 15, 12] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] text-on-tertiary-container opacity-20 pointer-events-none">account_balance</motion.span>
        </motion.section>

        {/* Upcoming Debts Estimate Card */}
        <motion.section whileHover={{ scale: 1.02, y: -2 }} className="col-span-1 bg-surface-container border-4 border-outline rounded-3xl p-6 shadow-[4px_4px_0_0_var(--theme-outline)] flex flex-col justify-start max-h-[300px] overflow-y-auto no-scrollbar">
          <div className="flex items-center gap-2 mb-4 sticky top-0 bg-surface-container z-10 py-1">
             <span className="material-symbols-outlined text-error">calendar_month</span>
             <p className="font-label-bold text-on-surface-variant uppercase tracking-widest text-xs font-bold">Estimasi Kedepan</p>
          </div>
          
          {loading ? (
             <p className="text-sm">...</p>
          ) : upcomingMonths?.length === 0 ? (
             <p className="text-xs font-body-md text-on-surface-variant font-bold">Tidak ada tagihan jatuh tempo.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingMonths?.map(um => (
                <details key={um.month} className="group bg-surface rounded-xl border-2 border-outline p-3 shadow-[2px_2px_0_0_var(--theme-outline)] open:bg-surface-bright transition-colors">
                  <summary className="font-label-bold text-on-background cursor-pointer flex justify-between items-center outline-none">
                     <span className="text-sm">{um.month}</span>
                     <span className="text-error text-sm">{formatRupiah(um.total)}</span>
                  </summary>
                  <ul className="mt-3 space-y-2 border-t-2 border-outline border-dashed pt-3">
                    {um.items.map(item => (
                      <li key={item.id} className="flex justify-between text-xs font-body-md text-on-surface-variant font-bold">
                        <span className="truncate mr-2">{item.name}</span>
                        <span className="shrink-0">{formatRupiah(item.remainingAmount)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      {/* Debt Categories Tabs */}
      <section className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {(["all", "active", "paid"] as const).map((f) => {
           const isSelected = filter === f;
           const label = f === "active" ? `Active` : f === "paid" ? `Paid` : `All Debts`;
           return (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-full font-label-bold whitespace-nowrap border-2 border-outline transition-all ${
                isSelected 
                  ? "bg-primary-container text-on-primary-container shadow-[2px_2px_0_0_var(--theme-outline)]"
                  : "bg-surface text-on-background hover:bg-surface-bright"
              }`}
            >
              {label}
            </motion.button>
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
      <motion.section whileHover={{ rotate: 1 }} className="bg-surface-container-high border-2 border-outline rounded-3xl p-6 border-dashed text-center mt-10">
        <p className="italic font-body-md text-on-surface-variant font-bold">"Hutang adalah beban, makan jangan kebanyakan utang, balikin sana."</p>
      </motion.section>

      {/* Modals */}
      <DebtForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditDebt(null); }}
        editData={editDebt}
      />
      
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { setEditDebt(null); setShowForm(true); }}
        className="fixed right-6 bottom-24 md:right-12 md:bottom-12 w-16 h-16 bg-primary-container border-[3px] border-outline rounded-full shadow-[4px_4px_0_0_var(--theme-outline)] z-50 flex items-center justify-center group"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </motion.button>
    </div>
  );
}
