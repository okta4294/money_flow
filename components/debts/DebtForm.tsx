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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700/50 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <i className="fa-solid fa-credit-card text-amber-400 text-base"></i>
            </div>
            <h2 className="text-white font-semibold text-lg">
              {editData ? "Edit Hutang" : "Tambah Hutang/Paylater"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1.5">
              Nama Hutang / Paylater
            </label>
            <input
              id="debt-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Shopee Paylater, KTA BCA..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Total Amount */}
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1.5">
              {editData ? "Total Hutang (diperbarui)" : "Total Hutang"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
              <input
                id="debt-amount-input"
                type="text"
                inputMode="numeric"
                value={formatRupiah(amount)}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white text-base font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1.5">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-calendar text-[12px]"></i>
                Jatuh Tempo (opsional)
              </span>
            </label>
            <input
              id="debt-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-slate-400 text-xs font-medium block mb-1.5">Catatan (opsional)</label>
            <input
              id="debt-note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tambahkan catatan..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-slate-600"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-all"
            >
              Batal
            </button>
            <button
              id="save-debt"
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : editData ? "Perbarui" : "Tambah Hutang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
