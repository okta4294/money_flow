"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useGlobalData } from "@/lib/data-context";
import { addAccount, updateAccount, deleteAccount, AccountInput, AccountType } from "@/lib/firestore/accounts";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"
];

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: "bank", label: "Bank", icon: "account_balance" },
  { value: "ewallet", label: "Dompet Digital", icon: "account_balance_wallet" },
  { value: "cash", label: "Uang Tunai", icon: "payments" },
  { value: "other", label: "Lainnya", icon: "help" },
];

export function AccountManager() {
  const { user } = useAuth();
  const { accounts, accountsLoading: loading, accountBalances: balances } = useGlobalData();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [color, setColor] = useState(COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenNew = () => {
    setEditingId(null);
    setName("");
    setType("bank");
    setColor(COLORS[0]);
    setIsOpen(true);
  };

  const handleOpenEdit = (acc: any) => {
    setEditingId(acc.id);
    setName(acc.name);
    setType(acc.type);
    setColor(acc.color);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setSubmitting(true);
    try {
      const data: AccountInput = { name: name.trim(), type, color };
      if (editingId) {
        await updateAccount(user.uid, editingId, data);
      } else {
        await addAccount(user.uid, data);
      }
      setIsOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Hapus akun ini?")) return;
    await deleteAccount(user.uid, id);
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getIcon = (accType: string) => {
    const config = ACCOUNT_TYPES.find((t) => t.value === accType);
    const iconClass = config?.icon || "help";
    return <span className="material-symbols-outlined text-2xl">{iconClass}</span>;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 bg-surface-bright neo-brutalist-border rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  const bgColors = [
    "bg-primary-container text-on-primary-container",
    "bg-secondary-container text-on-secondary-container",
    "bg-tertiary-container text-on-tertiary-container",
    "bg-secondary-fixed-dim text-on-secondary-fixed",
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenNew}
          className="min-h-[190px] rounded-3xl border-4 border-dashed border-outline bg-surface hover:bg-surface-bright flex flex-col items-center justify-center gap-2.5 p-6 transition-all group shadow-[5px_5px_0_0_var(--theme-outline)]"
        >
          <div className="w-12 h-12 rounded-2xl bg-surface-container-highest border-2 border-outline flex items-center justify-center shadow-[2px_2px_0_0_var(--theme-outline)] transition-colors">
            <span className="material-symbols-outlined text-on-background text-2xl group-hover:rotate-90 transition-transform">add</span>
          </div>
          <span className="font-label-bold text-sm text-on-surface-variant font-bold uppercase tracking-wider">Tambah Akun</span>
        </motion.button>

        {accounts.map((acc, idx) => {
          const colorClass = bgColors[idx % bgColors.length];
          return (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              key={acc.id}
              className={`group relative min-h-[190px] border-4 border-outline rounded-3xl p-6 flex flex-col justify-between items-start text-left shadow-[5px_5px_0_0_var(--theme-outline)] hover:shadow-[7px_7px_0_0_var(--theme-outline)] transition-all ${colorClass}`}
            >
              <div className="flex w-full justify-between items-start gap-3">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-surface border-2 border-outline flex items-center justify-center text-on-surface shadow-[2px_2px_0_0_var(--theme-outline)] shrink-0">
                    {getIcon(acc.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-headline-md text-xl font-black leading-tight text-inherit truncate">
                        {acc.name}
                      </h3>
                    </div>
                    <p className="font-label-bold text-xs uppercase tracking-wider opacity-75 mt-1">
                      {ACCOUNT_TYPES.find((t) => t.value === acc.type)?.label}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(acc)}
                    title="Edit Akun"
                    className="w-9 h-9 rounded-xl bg-surface border-2 border-outline text-on-surface flex items-center justify-center hover:bg-surface-bright shadow-[1.5px_1.5px_0_0_var(--theme-outline)] active-press-sm transition-transform"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(acc.id)}
                    title="Hapus Akun"
                    className="w-9 h-9 rounded-xl bg-error text-on-error border-2 border-outline flex items-center justify-center hover:opacity-90 shadow-[1.5px_1.5px_0_0_var(--theme-outline)] active-press-sm transition-transform"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              {balances[acc.id] !== undefined && (
                <div className="w-full mt-5 pt-3 border-t-2 border-outline/15">
                  <p className="text-[11px] font-label-bold uppercase tracking-widest opacity-80 mb-0.5">Saldo Saat Ini</p>
                  <p className="font-display-lg text-2xl sm:text-3xl font-black tracking-tight leading-normal text-inherit truncate">
                    {formatRupiah(balances[acc.id])}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative bg-surface rounded-3xl w-full max-w-md p-6 border-[3px] border-outline shadow-[6px_6px_0_0_var(--theme-outline)] z-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline-lg text-on-background tracking-tighter" style={{ WebkitTextStroke: '0.5px var(--theme-outline)' }}>
                {editingId ? "Edit Akun" : "Akun Baru"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-on-surface-variant font-label-bold block mb-1.5 uppercase tracking-widest text-xs">Nama Akun</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: BCA, GoPay, Dompet Tunai..."
                  className="w-full bg-surface-container-lowest border-2 border-outline rounded-xl px-4 py-3 text-on-background font-body-md focus:outline-none focus:shadow-[2px_2px_0_0_var(--theme-outline)] transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-on-surface-variant font-label-bold block mb-1.5 uppercase tracking-widest text-xs">Tipe Akun</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map((t) => (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex items-center gap-2 px-3 py-3 rounded-xl font-label-bold transition-all border-2 border-outline ${
                        type === t.value 
                          ? "bg-primary-container text-on-primary-container shadow-[2px_2px_0_0_var(--theme-outline)] -translate-y-0.5 -translate-x-0.5" 
                          : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-bright"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                      {t.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-surface border-2 border-outline text-on-background font-label-bold transition-all hover:bg-surface-bright active-press"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-primary-container border-2 border-outline text-on-primary-container font-label-bold transition-all disabled:opacity-50 active-press shadow-[2px_2px_0_0_var(--theme-outline)] hover:shadow-[4px_4px_0_0_var(--theme-outline)]"
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}
