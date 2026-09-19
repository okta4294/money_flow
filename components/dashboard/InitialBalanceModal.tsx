"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { setInitialBalance } from "@/lib/firestore/balances";
import { formatRupiahInput } from "@/lib/utils";

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

export function InitialBalanceModal({
  open, onClose, currentBalance, year, month, onSaved,
}: InitialBalanceModalProps) {
  const { user } = useAuth();
  const [rawValue, setRawValue] = useState(
    currentBalance > 0 ? currentBalance.toString() : ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setRawValue(currentBalance > 0 ? currentBalance.toString() : "");
    }
  }, [currentBalance, open]);

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
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-surface rounded-3xl w-full max-w-md p-6 border-[3px] border-outline shadow-[6px_6px_0_0_var(--theme-outline)] z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors p-1"
          aria-label="Tutup"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <div className="w-12 h-12 bg-primary-container border-2 border-outline rounded-2xl flex items-center justify-center mb-4 text-on-primary-container shadow-sm">
          <i className="fa-solid fa-piggy-bank text-2xl"></i>
        </div>

        <h2 className="font-headline-lg text-on-background text-2xl tracking-tighter" style={{ WebkitTextStroke: '0.5px var(--theme-outline)' }}>
          Saldo Awal
        </h2>
        <p className="font-body-md text-on-surface-variant text-sm mb-6">
          Set saldo awal untuk {MONTHS[month - 1]} {year}
        </p>

        <div className="mb-6">
          <label className="font-label-bold text-on-surface uppercase tracking-widest text-xs block mb-2">
            Jumlah Saldo Awal
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display-lg text-on-surface text-xl">
              Rp
            </span>
            <input
              id="initial-balance-input"
              type="text"
              inputMode="numeric"
              value={formatRupiahInput(rawValue)}
              onChange={(e) => setRawValue(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="w-full bg-surface-container neo-brutalist-border pl-12 pr-4 py-3 text-on-surface text-xl font-display-lg focus:outline-none focus:ring-2 focus:ring-primary-container transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl bg-surface border-2 border-outline text-on-background font-label-bold uppercase tracking-wider transition-all hover:bg-surface-bright active-press"
          >
            Batal
          </button>
          <button
            id="save-initial-balance"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl bg-primary-container border-2 border-outline text-on-primary-container font-label-bold uppercase tracking-wider transition-all disabled:opacity-50 active-press shadow-[2px_2px_0_0_var(--theme-outline)] hover:shadow-[4px_4px_0_0_var(--theme-outline)]"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
