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
  const {
    accounts,
    accountsLoading: loading,
    accountBalances: balances,
    totalAccountBalance,
  } = useGlobalData();
  
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
    <div className="space-y-6">
      {/* Kartu Hero Kuning: Total Saldo Kas Seluruh Dompet sesuai FigCraft Frame 06 */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="bg-primary-container text-on-primary-container border-4 border-outline rounded-3xl p-5 sm:p-6 shadow-[4px_4px_0_0_var(--theme-outline)] flex flex-col justify-between gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-label-bold text-xs sm:text-sm uppercase font-extrabold tracking-wide">
            Total Saldo Kas Seluruh Dompet ({accounts.length} Akun Aktif)
          </span>

          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-bright text-on-surface border-2 border-outline font-label-bold text-xs uppercase shadow-[2px_2px_0_0_var(--theme-outline)] active-press-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Tambah Dompet Baru</span>
          </button>
        </div>

        <h3 className="font-display-lg text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-on-primary-container">
          {formatRupiah(totalAccountBalance)}
        </h3>
      </motion.div>

      {/* Kartu Daftar Saldo Real-Time per Akun Dompet sesuai FigCraft Frame 06 */}
      <div className="bg-surface border-4 border-outline rounded-3xl p-5 sm:p-6 shadow-[4px_4px_0_0_var(--theme-outline)] space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-headline-md text-sm sm:text-base uppercase font-extrabold text-on-surface">
            Saldo Real-Time Per Akun Dompet
          </h3>
          <span className="text-xs font-label-bold text-on-surface-variant">
            {accounts.length} Rekening / Dompet
          </span>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-background border-2 border-dashed border-outline rounded-2xl p-8 text-center space-y-2">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">
              account_balance_wallet
            </span>
            <p className="font-label-bold text-sm text-on-surface uppercase">
              Belum ada dompet atau rekening terdaftar
            </p>
            <button
              type="button"
              onClick={handleOpenNew}
              className="mt-1 px-4 py-2 rounded-xl bg-primary-container text-on-primary-container border-2 border-outline font-label-bold text-xs uppercase shadow-[2px_2px_0_0_var(--theme-outline)] cursor-pointer"
            >
              + Tambah Dompet Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {accounts.map((acc, idx) => {
              const colorClass = bgColors[idx % bgColors.length];
              const bal = balances[acc.id] ?? 0;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  key={acc.id}
                  onClick={() => handleOpenEdit(acc)}
                  className="bg-background hover:bg-surface-bright border-2 border-outline rounded-2xl p-4 flex items-center justify-between gap-3 shadow-[2px_2px_0_0_var(--theme-outline)] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-xl border-2 border-outline flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0_0_var(--theme-outline)] ${colorClass}`}
                    >
                      {getIcon(acc.type)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-label-bold text-sm sm:text-base font-extrabold text-on-surface truncate">
                        {acc.name}
                      </h4>
                      <p className="text-xs font-body-sm text-on-surface-variant truncate">
                        {
                          ACCOUNT_TYPES.find((t) => t.value === acc.type)
                            ?.label
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-display-lg text-base sm:text-lg font-black text-on-surface whitespace-nowrap">
                      {formatRupiah(bal)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(acc);
                        }}
                        title="Edit Akun"
                        className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-bright border-2 border-outline text-on-surface flex items-center justify-center active-press-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">
                          edit
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(acc.id);
                        }}
                        title="Hapus Akun"
                        className="w-8 h-8 rounded-lg bg-error-container text-on-error-container border-2 border-outline flex items-center justify-center hover:opacity-90 active-press-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
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
