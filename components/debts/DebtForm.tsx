"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { addDebt, updateDebt, Debt, DebtInput } from "@/lib/firestore/debts";

interface DebtFormProps {
  open: boolean;
  onClose: () => void;
  editData?: Debt | null;
}

function formatRupiah(value: string) {
  const num = value.replace(/\D/g, "");
  return num ? parseInt(num).toLocaleString("id-ID") : "";
}

export function DebtForm({ open, onClose, editData }: DebtFormProps) {
  const { user } = useAuth();
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

  if (!open) return null;

  const numericAmount = parseInt(amount.replace(/\D/g, "") || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) { setError("Nama hutang harus diisi"); return; }
    if (numericAmount <= 0) { setError("Masukkan jumlah yang valid"); return; }

    setError("");
    setLoading(true);
    try {
      // Bangun objek tanpa field undefined — Firestore tidak bisa menyimpan undefined
      const data: DebtInput = {
        name: name.trim(),
        totalAmount: numericAmount,
        ...(dueDate ? { dueDate } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      };
      if (editData) {
        await updateDebt(user.uid, editData.id, data);
      } else {
        await addDebt(user.uid, data);
      }
      onClose();
    } catch {
      setError("Gagal menyimpan hutang");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-tertiary-container neo-brutalist-border p-6 neo-brutalist-shadow w-full sm:max-w-md max-h-[90vh] overflow-y-auto z-10 animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b-4 border-black dark:border-white pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-black dark:border-white bg-tertiary flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <i className="fa-solid fa-credit-card text-on-tertiary text-xl"></i>
            </div>
            <h2 className="font-display-lg text-2xl text-on-tertiary-container uppercase tracking-tighter">
              {editData ? "Edit Hutang" : "Tambah Hutang"}
            </h2>
          </div>
          <button onClick={onClose} className="bg-error text-on-error neo-brutalist-border p-1 w-8 h-8 flex items-center justify-center active-press">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="font-label-bold text-on-tertiary-container uppercase tracking-widest text-xs block mb-2">
              Nama Hutang / Paylater
            </label>
            <input
              id="debt-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CONTOH: SHOPEE PAYLATER..."
              className="w-full bg-surface neo-brutalist-border px-4 py-3 text-on-surface font-label-bold uppercase text-sm focus:outline-none focus:ring-2 focus:ring-tertiary transition-colors placeholder:text-on-surface-variant"
            />
          </div>

          {/* Total Amount */}
          <div>
            <label className="font-label-bold text-on-tertiary-container uppercase tracking-widest text-xs block mb-2">
              {editData ? "Total Hutang (diperbarui)" : "Total Hutang"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display-lg text-on-surface text-xl">Rp</span>
              <input
                id="debt-amount-input"
                type="text"
                inputMode="numeric"
                value={formatRupiah(amount)}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-surface neo-brutalist-border pl-12 pr-4 py-3 text-on-surface text-xl font-display-lg focus:outline-none focus:ring-2 focus:ring-tertiary transition-colors"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="font-label-bold text-on-tertiary-container uppercase tracking-widest text-xs block mb-2 flex items-center gap-2">
              <i className="fa-solid fa-calendar"></i>
              Jatuh Tempo (opsional)
            </label>
            <input
              id="debt-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-surface neo-brutalist-border px-4 py-3 text-on-surface font-label-bold uppercase text-xs focus:outline-none focus:ring-2 focus:ring-tertiary transition-colors cursor-pointer"
            />
          </div>

          {/* Note */}
          <div>
            <label className="font-label-bold text-on-tertiary-container uppercase tracking-widest text-xs block mb-2">Catatan (opsional)</label>
            <input
              id="debt-note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="TAMBAHKAN CATATAN..."
              className="w-full bg-surface neo-brutalist-border px-4 py-3 text-on-surface font-label-bold uppercase text-sm focus:outline-none focus:ring-2 focus:ring-tertiary transition-colors placeholder:text-on-surface-variant"
            />
          </div>

          {error && (
            <div className="bg-error text-on-error neo-brutalist-border px-4 py-3 font-label-bold uppercase text-xs flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation"></i> {error}
            </div>
          )}

          <div className="flex gap-4 pt-4 mt-8 border-t-4 border-black dark:border-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-surface text-on-surface font-label-bold uppercase tracking-widest neo-brutalist-border active-press"
            >
              Batal
            </button>
            <button
              id="save-debt"
              type="submit"
              disabled={loading}
              className="flex-1 py-4 font-label-bold uppercase tracking-widest text-on-tertiary bg-tertiary neo-brutalist-border active-press disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : editData ? "Perbarui" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
