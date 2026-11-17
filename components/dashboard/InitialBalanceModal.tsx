"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { setInitialBalance } from "@/lib/firestore/balances";
import { formatRupiahInput } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setRawValue(currentBalance > 0 ? currentBalance.toString() : "");
      setError("");
    }
  }, [currentBalance, open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onClose]);

  const numericValue = parseInt(rawValue.replace(/\D/g, "") || "0");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setLoading(true);
    try {
      await setInitialBalance(user.uid, year, month, numericValue);
      onSaved();
      onClose();
    } catch {
      setError("Gagal menyimpan saldo awal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="initial-balance-title"
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !loading && onClose()}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="relative bg-surface rounded-3xl w-full max-w-md p-6 border-2 border-outline shadow-[6px_6px_0_0_var(--theme-outline)] z-10"
          >
            <div className="flex items-start justify-between gap-3 mb-5 border-b-2 border-outline/20 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 bg-primary-container border-2 border-outline rounded-2xl flex items-center justify-center shrink-0 text-on-primary-container shadow-[2px_2px_0_0_var(--theme-outline)]">
                  <span className="material-symbols-outlined text-2xl">savings</span>
                </div>
                <div className="min-w-0">
                  <h2
                    id="initial-balance-title"
                    className="font-headline-md text-on-surface text-xl sm:text-2xl font-extrabold tracking-tight leading-tight"
                  >
                    Saldo Awal
                  </h2>
                  <p className="font-body-md text-on-surface-variant text-xs sm:text-sm mt-0.5">
                    Atur saldo awal untuk {MONTHS[month - 1]} {year}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-10 h-10 rounded-xl bg-error-container text-on-error-container border-2 border-outline shadow-[2px_2px_0_0_var(--theme-outline)] active-press-sm flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
                aria-label="Tutup modal"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label
                  htmlFor="initial-balance-input"
                  className="font-label-bold text-on-surface-variant uppercase tracking-wider text-xs block mb-2"
                >
                  Jumlah Saldo Awal
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display-lg font-bold text-on-surface-variant text-lg">
                    Rp
                  </span>
                  <input
                    id="initial-balance-input"
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={formatRupiahInput(rawValue)}
                    onChange={(e) => setRawValue(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    className="w-full bg-surface-container border-2 border-outline rounded-2xl pl-12 pr-4 py-3 text-on-surface text-xl font-display-lg font-bold tabular-nums focus:outline-none focus:border-secondary focus:shadow-[2px_2px_0_0_var(--theme-secondary)] transition-all"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="bg-error-container text-on-error-container border-2 border-outline rounded-xl px-4 py-3 font-label-bold text-xs flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base shrink-0">warning</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-surface border-2 border-outline text-on-surface font-label-bold text-xs uppercase tracking-wider transition-all hover:bg-surface-bright active-press-sm cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  id="save-initial-balance"
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-primary-container border-2 border-outline text-on-primary-container font-label-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 active-press-sm shadow-[2px_2px_0_0_var(--theme-outline)] hover:shadow-[3px_3px_0_0_var(--theme-outline)] cursor-pointer"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
