"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useGlobalData } from "@/lib/data-context";
import { addAccount, updateAccount, deleteAccount, AccountInput, AccountType } from "@/lib/firestore/accounts";
import { formatRupiah } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { triggerSakugaPop, showSakugaToast } from "@/lib/sakuga";
import { SakugaInput } from "@/components/ui/SakugaInput";

const COLORS = [
  "#2156b5", "#1d7543", "#efc44e", "#c84332",
  "#0f766e", "#d97706", "#334155", "#575046"
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

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
        showSakugaToast("Dompet diperbarui!");
      } else {
        await addAccount(user.uid, data);
        showSakugaToast("Dompet tersimpan!");
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

  const getIcon = (accType: string) => {
    const config = ACCOUNT_TYPES.find((t) => t.value === accType);
    const iconClass = config?.icon || "help";
    return <span className="material-symbols-outlined text-2xl">{iconClass}</span>;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 bg-surface-bright comic-card animate-pulse" />
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
      {/* Kartu Hero Kuning: Total Saldo Kas Seluruh Dompet */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="bg-primary-container text-on-primary-container comic-card sketch-crosshatch p-5 sm:p-6 flex flex-col justify-between gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-label-bold text-xs sm:text-sm uppercase font-extrabold tracking-wide">
            Total Saldo Kas Seluruh Dompet ({accounts.length} Akun Aktif)
          </h2>

          <button
            type="button"
            onClick={(e) => {
              triggerSakugaPop(e.currentTarget, "sparkle");
              handleOpenNew();
            }}
            className="min-h-11 px-4 py-2 rounded-xl bg-surface hover:bg-surface-bright text-on-surface border-2 border-outline font-label-bold font-bold text-xs sm:text-sm shadow-[2px_2px_0_0_var(--theme-outline)] active-press-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Tambah Dompet Baru</span>
          </button>
        </div>

        <p className="font-display-lg text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-on-primary-container tabular-nums">
          {formatRupiah(totalAccountBalance)}
        </p>
      </motion.div>

      {/* Kartu Daftar Saldo Real-Time per Akun Dompet */}
      <div className="bg-surface comic-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-headline-md text-base sm:text-lg font-extrabold text-on-surface">
            Saldo Real-Time Per Akun Dompet
          </h2>
          <span className="text-xs sm:text-sm font-label-bold font-bold text-on-surface-variant">
            {accounts.length} Rekening / Dompet
          </span>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-background border-2 border-dashed border-outline/60 rounded-xl p-8 text-center space-y-2 sketch-hatch">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">
              account_balance_wallet
            </span>
            <p className="font-label-bold font-bold text-sm text-on-surface">
              Belum ada dompet atau rekening terdaftar
            </p>
            <button
              type="button"
              onClick={handleOpenNew}
              className="mt-1 min-h-11 px-4 py-2 rounded-xl bg-primary-container text-on-primary-container border-2 border-outline font-label-bold font-bold text-xs sm:text-sm shadow-[2px_2px_0_0_var(--theme-outline)] cursor-pointer"
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
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenEdit(acc)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenEdit(acc);
                    }
                  }}
                  className="bg-background hover:bg-surface-bright border-2 border-outline/50 hover:border-outline rounded-xl p-4 flex flex-col gap-2.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  <div className="flex items-start justify-between gap-2.5 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-2 border-outline flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--theme-outline)] ${colorClass}`}
                      >
                        {getIcon(acc.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-label-bold text-base font-extrabold text-on-surface truncate">
                          {acc.name}
                        </h3>
                        <p className="text-xs font-body-sm text-on-surface-variant truncate">
                          {
                            ACCOUNT_TYPES.find((t) => t.value === acc.type)
                              ?.label
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(acc);
                        }}
                        title="Edit Akun"
                        aria-label={`Edit ${acc.name}`}
                        className="w-11 h-11 rounded-xl bg-surface hover:bg-surface-bright border-2 border-outline text-on-surface flex items-center justify-center active-press-sm cursor-pointer"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-base">
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
                        aria-label={`Hapus ${acc.name}`}
                        className="w-11 h-11 rounded-xl bg-error-container text-on-error-container border-2 border-outline flex items-center justify-center hover:opacity-90 active-press-sm cursor-pointer"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-base">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t-2 border-outline/15 min-w-0">
                    <span className="text-xs font-label-bold font-semibold uppercase text-on-surface-variant tracking-wider">
                      Saldo Saat Ini
                    </span>
                    <span className="font-display-lg text-base sm:text-lg font-extrabold text-on-surface whitespace-nowrap tabular-nums">
                      {formatRupiah(bal)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
      {isOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="account-modal-title" className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative bg-surface comic-modal w-full max-w-md p-6 z-10"
          >
            <div className="flex items-center justify-between mb-5 pb-3.5 border-b-[3px] border-outline">
              <h2 id="account-modal-title" className="font-display-lg text-xl sm:text-2xl font-extrabold text-on-background tracking-tight">
                {editingId ? "Edit Akun" : "Akun Baru"}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Tutup modal"
                className="w-11 h-11 rounded-xl bg-error-container text-on-error-container border-2 border-outline flex items-center justify-center active-press-sm cursor-pointer shadow-[2px_2px_0_0_var(--theme-outline)]"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="account-name-input" className="text-on-surface-variant font-label-bold font-bold block mb-1.5 uppercase tracking-wider text-xs">Nama Akun</label>
                <SakugaInput
                  id="account-name-input"
                  name="accountName"
                  label="Nama Akun"
                  autoFocus={!editingId}
                  value={name}
                  onValueChange={setName}
                  placeholder="Contoh: BCA, GoPay, Dompet Tunai..."
                  required
                  className="sakuga-field--lowest"
                />
              </div>

              <div>
                <span className="text-on-surface-variant font-label-bold font-bold block mb-1.5 uppercase tracking-wider text-xs">Tipe Akun</span>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map((t) => (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`min-h-12 flex items-center gap-2 px-3 py-3 rounded-xl font-label-bold font-bold text-sm transition-all border-2 border-outline cursor-pointer ${
                        type === t.value 
                          ? "bg-primary-container text-on-primary-container shadow-[2px_2px_0_0_var(--theme-outline)] sketch-hatch" 
                          : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-bright"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                      {t.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t-[3px] border-outline">
                <sakuga-button
                  variant="secondary"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 sakuga-cancel-btn"
                >
                  Batal
                </sakuga-button>
                <button
                  type="submit"
                  disabled={submitting}
                  onClick={(e) => triggerSakugaPop(e.currentTarget, "impact")}
                  className="flex-1 min-h-11 py-3 rounded-xl bg-primary-container border-2 border-outline text-on-primary-container font-label-bold font-extrabold text-sm transition-all disabled:opacity-50 active-press shadow-[2px_2px_0_0_var(--theme-outline)] cursor-pointer sketch-hatch"
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
