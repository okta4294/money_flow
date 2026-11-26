"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCategories } from "@/hooks/useCategories";
import { addDebt, updateDebt, Debt, DebtInput } from "@/lib/firestore/debts";
import { ensureDebtCategoryExists } from "@/lib/firestore/categories";
import { motion, AnimatePresence } from "framer-motion";
import { formatRupiahInput } from "@/lib/utils";
import { triggerSakugaPop, showSakugaToast } from "@/lib/sakuga";
import { SakugaInput } from "@/components/ui/SakugaInput";

interface DebtFormProps {
  open: boolean;
  onClose: () => void;
  editData?: Debt | null;
}

export function DebtForm({ open, onClose, editData }: DebtFormProps) {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setAmount(editData.totalAmount.toString());
      setDueDate(editData.dueDate || "");
      setNote(editData.note || "");
    } else {
      setName("");
      setAmount("");
      setDueDate("");
      setNote("");
    }
    setError("");
  }, [editData, open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const numericAmount = parseInt(amount.replace(/\D/g, "") || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) { setError("Nama hutang harus diisi"); return; }
    if (numericAmount <= 0) { setError("Masukkan jumlah yang valid"); return; }

    setError("");
    setLoading(true);
    try {
      const data: DebtInput = editData
        ? {
            name: name.trim(),
            totalAmount: numericAmount,
            dueDate: dueDate || "",
            note: note.trim(),
          }
        : {
            name: name.trim(),
            totalAmount: numericAmount,
            ...(dueDate ? { dueDate } : {}),
            ...(note.trim() ? { note: note.trim() } : {}),
          };
      if (editData) {
        await updateDebt(user.uid, editData.id, data);
        showSakugaToast("Hutang diperbarui!");
      } else {
        await addDebt(user.uid, data);
        await ensureDebtCategoryExists(user.uid, categories);
        showSakugaToast("Hutang tersimpan!");
      }
      onClose();
    } catch {
      setError("Gagal menyimpan hutang");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
    {open && (
      <div role="dialog" aria-modal="true" aria-labelledby="debt-modal-title" className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="relative bg-surface comic-modal p-6 w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto z-10"
        >
          <div className="flex items-center justify-between mb-5 border-b-[3px] border-outline pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 border-2 border-outline bg-tertiary-container text-on-tertiary-container flex items-center justify-center rounded-xl shadow-[2px_2px_0_0_var(--theme-outline)]">
                <span aria-hidden="true" className="material-symbols-outlined text-2xl">
                  credit_card
                </span>
              </div>
              <h2 id="debt-modal-title" className="font-display-lg font-extrabold text-xl sm:text-2xl text-on-surface tracking-tight">
                {editData ? "Edit Hutang" : "Tambah Hutang"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="bg-error-container text-on-error-container border-2 border-outline rounded-xl w-11 h-11 flex items-center justify-center active-press-sm hover:opacity-90 cursor-pointer shadow-[2px_2px_0_0_var(--theme-outline)]"
              aria-label="Tutup modal"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="debt-name-input" className="font-label-bold font-bold text-on-surface-variant uppercase tracking-wider text-xs block mb-1.5">
              Nama Hutang / Paylater
            </label>
            <SakugaInput
              id="debt-name-input"
              name="debtName"
              label="Nama Hutang / Paylater"
              autoFocus={!editData}
              value={name}
              onValueChange={setName}
              placeholder="Contoh: Shopee Paylater..."
            />
          </div>

          <div>
            <label htmlFor="debt-amount-input" className="font-label-bold font-bold text-on-surface-variant uppercase tracking-wider text-xs block mb-1.5">
              {editData ? "Total Hutang (diperbarui)" : "Total Hutang"}
            </label>
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none z-10 absolute left-3.5 top-1/2 -translate-y-1/2 font-display-lg font-extrabold text-lg text-on-surface">Rp</span>
              <SakugaInput
                id="debt-amount-input"
                name="debtAmount"
                label={editData ? "Total Hutang (diperbarui)" : "Total Hutang"}
                inputMode="numeric"
                value={formatRupiahInput(amount)}
                onValueChange={setAmount}
                placeholder="0"
                className="sakuga-field--pl-rp"
              />
            </div>
          </div>

          <div>
            <label htmlFor="debt-due-date" className="font-label-bold font-bold text-on-surface-variant uppercase tracking-wider text-xs mb-1.5 flex items-center gap-1.5">
              <span aria-hidden="true" className="material-symbols-outlined text-base">
                calendar_month
              </span>
              <span>Jatuh Tempo (opsional)</span>
            </label>
            <input
              id="debt-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full min-h-12 bg-background border-2 border-outline rounded-xl px-4 py-3 text-on-surface font-label-bold font-semibold text-base sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus:shadow-[2px_2px_0_0_var(--theme-outline)] transition-colors cursor-pointer"
            />
          </div>

          <div>
            <label htmlFor="debt-note-input" className="font-label-bold font-bold text-on-surface-variant uppercase tracking-wider text-xs block mb-1.5">Catatan (opsional)</label>
            <SakugaInput
              id="debt-note-input"
              name="debtNote"
              label="Catatan (opsional)"
              value={note}
              onValueChange={setNote}
              placeholder="Tambahkan catatan..."
            />
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container border-2 border-outline rounded-xl px-4 py-3 font-label-bold font-bold text-xs sm:text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">
                warning
              </span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4 mt-6 border-t-[3px] border-outline">
            <sakuga-button
              variant="secondary"
              onClick={onClose}
              className="flex-1 sakuga-cancel-btn"
            >
              Batal
            </sakuga-button>
            <button
              id="save-debt"
              type="submit"
              disabled={loading}
              onClick={(e) => triggerSakugaPop(e.currentTarget, "impact")}
              className="flex-1 min-h-11 py-3 rounded-xl font-label-bold font-extrabold text-sm uppercase tracking-wider text-on-tertiary-container bg-tertiary-container border-2 border-outline active-press disabled:opacity-50 shadow-[2px_2px_0_0_var(--theme-outline)] cursor-pointer sketch-hatch"
            >
              {loading ? "Menyimpan..." : editData ? "Perbarui" : "Tambah"}
            </button>
          </div>
        </form>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );
}
