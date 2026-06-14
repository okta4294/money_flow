"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { setInitialBalance } from "@/lib/firestore/balances";

interface InitialBalanceModalProps {
  open: boolean;
  onClose: () => void;
  currentBalance: number;
  year: number;
  month: number;
  onSaved: () => void;
}

const MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function formatRupiah(value: string) {
  const num = value.replace(/\D/g, "");
  return num ? parseInt(num).toLocaleString("id-ID") : "";
}

export function InitialBalanceModal({
  open, onClose, currentBalance, year, month, onSaved,
}: InitialBalanceModalProps) {
  const { user } = useAuth();
  const [rawValue, setRawValue] = useState(
    currentBalance > 0 ? currentBalance.toString() : ""
  );
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const numericValue = parseInt(rawValue.replace(/\D/g, "") || "0");

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setInitialBalance(user.uid, year, month, numericValue);
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        {/* Icon */}
        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
          <i className="fa-solid fa-piggy-bank text-emerald-400 text-2xl"></i>
        </div>

        <h2 className="text-slate-900 dark:text-white font-semibold text-lg mb-1">Saldo Awal</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Set saldo awal untuk {MONTHS[month - 1]} {year}
        </p>

        {/* Input */}
        <div className="mb-6">
          <label className="text-slate-500 dark:text-slate-400 text-xs font-medium block mb-2">
            Jumlah Saldo Awal
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-sm font-medium">
              Rp
            </span>
            <input
              id="initial-balance-input"
              type="text"
              inputMode="numeric"
              value={formatRupiah(rawValue)}
              onChange={(e) => setRawValue(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 dark:text-white text-base font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 text-sm font-medium transition-all"
          >
            Batal
          </button>
          <button
            id="save-initial-balance"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
