"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Category, addCategory, updateCategory, deleteCategory } from "@/lib/firestore/categories";
import { TransactionType } from "@/lib/firestore/transactions";
import {
  isFixedExpenseCategory,
  isEssentialExpenseCategory,
  isEligibleIncomeCategory,
} from "@/lib/budget-calculator";
import { motion, AnimatePresence } from "framer-motion";

interface CategoryManagerProps {
  categories: Category[];
  loading: boolean;
}

type ExpenseClassification = "auto" | "essential" | "fixed" | "variable";
type IncomeRole = "auto" | "primary" | "secondary";

const PRESET_ICONS = [
  "restaurant",
  "home",
  "directions_car",
  "local_cafe",
  "bolt",
  "sports_esports",
  "favorite",
  "school",
  "flight_takeoff",
  "account_balance_wallet",
  "payments",
  "savings",
  "trending_up",
  "work",
  "card_giftcard",
  "local_hospital",
  "checkroom",
  "music_note",
  "smartphone",
  "fitness_center",
];

export function CategoryManager({ categories, loading }: CategoryManagerProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<TransactionType>("expense");
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(PRESET_ICONS[0]);
  const [expenseClassification, setExpenseClassification] =
    useState<ExpenseClassification>("auto");
  const [incomeRole, setIncomeRole] = useState<IncomeRole>("auto");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [posFilter, setPosFilter] = useState<string>("all");

  const posOptions =
    tab === "expense"
      ? [
          { id: "auto", label: "Otomatis", color: "bg-background" },
          { id: "fixed", label: "Pos Tetap", color: "bg-primary-container/40" },
          { id: "essential", label: "Pos Pokok", color: "bg-tertiary-container/40" },
          { id: "variable", label: "Pos Variabel", color: "bg-secondary-container/30" },
        ]
      : [
          { id: "auto", label: "Otomatis", color: "bg-background" },
          { id: "primary", label: "Pemasukan Utama", color: "bg-tertiary-container/40" },
          { id: "secondary", label: "Pemasukan Sampingan", color: "bg-surface-container-high" },
        ];

  const filtered = categories.filter((c) => {
    if (c.type !== tab) return false;
    if (posFilter === "all") return true;
    if (tab === "expense") {
      if (posFilter === "auto") return c.isFixedExpense == null && c.isEssentialExpense == null;
      const fixed = isFixedExpenseCategory(c);
      const essential = !fixed && isEssentialExpenseCategory(c);
      if (posFilter === "fixed") return fixed;
      if (posFilter === "essential") return essential;
      return !fixed && !essential;
    }
    if (posFilter === "auto") return c.isEligibleForBudget == null;
    return posFilter === "primary" ? isEligibleIncomeCategory(c) : !isEligibleIncomeCategory(c);
  });

  const openAdd = () => {
    setEditData(null);
    setName("");
    setIcon(PRESET_ICONS[0]);
    setExpenseClassification("auto");
    setIncomeRole("auto");
    setError("");
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditData(cat);
    setName(cat.name);
    setIcon(cat.icon || PRESET_ICONS[0]);

    if (cat.isFixedExpense === true) {
      setExpenseClassification("fixed");
    } else if (cat.isEssentialExpense === true) {
      setExpenseClassification("essential");
    } else if (cat.isFixedExpense === false && cat.isEssentialExpense === false) {
      setExpenseClassification("variable");
    } else {
      setExpenseClassification("auto");
    }

    if (cat.isEligibleForBudget === true) {
      setIncomeRole("primary");
    } else if (cat.isEligibleForBudget === false) {
      setIncomeRole("secondary");
    } else {
      setIncomeRole("auto");
    }

    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) { setError("Nama kategori wajib diisi"); return; }
    setFormLoading(true);
    setError("");
    try {
      const budgetFlags =
        tab === "income"
          ? incomeRole === "auto"
            ? { isEligibleForBudget: null }
            : incomeRole === "primary"
            ? { isEligibleForBudget: true }
            : { isEligibleForBudget: false }
          : expenseClassification === "auto"
          ? { isFixedExpense: null, isEssentialExpense: null }
          : expenseClassification === "fixed"
          ? { isFixedExpense: true, isEssentialExpense: false }
          : expenseClassification === "essential"
          ? { isFixedExpense: false, isEssentialExpense: true }
          : { isFixedExpense: false, isEssentialExpense: false };

      if (editData) {
        await updateCategory(user.uid, editData.id, {
          name: name.trim(),
          icon,
          ...budgetFlags,
        });
      } else {
        await addCategory(user.uid, {
          name: name.trim(),
          type: tab,
          icon,
          color: "#000000",
          ...budgetFlags,
        });
      }
      setShowForm(false);
    } catch {
      setError("Gagal menyimpan kategori");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!user || !confirm(`Hapus kategori "${cat.name}"?`)) return;
    await deleteCategory(user.uid, cat.id);
  };

  const colors = [
    "bg-primary-container text-on-primary-container",
    "bg-secondary-container text-on-secondary-container",
    "bg-tertiary-container text-on-tertiary-container",
    "bg-secondary-fixed-dim text-on-secondary-fixed",
    "bg-primary-fixed text-on-primary-fixed",
    "bg-surface text-on-background",
  ];

  const expenseCount = categories.filter((c) => c.type === "expense").length;
  const incomeCount = categories.filter((c) => c.type === "income").length;

  return (
    <div className="space-y-6">
      {/* Bagian Atas: Tambah Kategori Baru + Klasifikasi Pos Anggaran sesuai FigCraft Frame 06 */}
      <div className="bg-surface border-4 border-outline rounded-3xl p-5 sm:p-6 shadow-[4px_4px_0_0_var(--theme-outline)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-headline-md text-sm sm:text-base uppercase font-extrabold text-on-surface">
              Tambah Kategori Baru + Klasifikasi Pos Anggaran
            </h3>
            <p className="text-xs font-body-sm text-on-surface-variant mt-0.5">
              Pilih tab Pengeluaran atau Pemasukan, lalu tambahkan atau ubah klasifikasi pos anggaran.
            </p>
          </div>

          <button
            id="add-category-btn"
            type="button"
            onClick={openAdd}
            className="px-4 py-2.5 rounded-xl bg-primary-container text-on-primary-container border-2 border-outline font-label-bold text-xs uppercase shadow-[2px_2px_0_0_var(--theme-outline)] hover:opacity-95 active-press-sm flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Tambah Kategori Baru</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t-2 border-outline/15">
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => { setTab("expense"); setPosFilter("all"); }}
              className={`px-4 py-2 font-label-bold text-xs uppercase rounded-xl transition-all whitespace-nowrap border-2 border-outline cursor-pointer ${
                tab === "expense"
                  ? "bg-primary-container text-on-primary-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold"
                  : "bg-background text-on-surface hover:bg-surface-bright"
              }`}
            >
              Pengeluaran ({expenseCount})
            </button>
            <button
              type="button"
              onClick={() => { setTab("income"); setPosFilter("all"); }}
              className={`px-4 py-2 font-label-bold text-xs uppercase rounded-xl transition-all whitespace-nowrap border-2 border-outline cursor-pointer ${
                tab === "income"
                  ? "bg-tertiary-container text-on-tertiary-container shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold"
                  : "bg-background text-on-surface hover:bg-surface-bright"
              }`}
            >
              Pemasukan ({incomeCount})
            </button>
          </div>

          <div className="text-[11px] font-label-bold text-on-surface-variant flex flex-wrap items-center gap-1.5">
            <span>Jenis Pos:</span>
            {posOptions.map((opt) => {
              const active = posFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPosFilter(active ? "all" : opt.id)}
                  className={`px-2.5 py-1 rounded-lg border-2 border-outline text-on-surface transition-all cursor-pointer ${opt.color} ${
                    active ? "shadow-[2px_2px_0_0_var(--theme-outline)] font-extrabold -translate-y-0.5" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Daftar Kategori Aktif sesuai FigCraft Frame 06 */}
      <div className="bg-surface border-4 border-outline rounded-3xl p-5 sm:p-6 shadow-[4px_4px_0_0_var(--theme-outline)] space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-headline-md text-sm sm:text-base uppercase font-extrabold text-on-surface">
            Daftar Kategori Aktif ({tab === "expense" ? "Pengeluaran" : "Pemasukan"})
          </h3>
          <span className="text-xs font-label-bold text-on-surface-variant">
            {filtered.length} Kategori
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-surface-bright border-2 border-outline animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-background border-2 border-dashed border-outline rounded-2xl p-8 text-center space-y-2">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">
              grid_view
            </span>
            <p className="font-label-bold text-sm text-on-surface uppercase">
              Belum ada kategori {tab === "expense" ? "pengeluaran" : "pemasukan"}
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="mt-1 px-4 py-2 rounded-xl bg-primary-container text-on-primary-container border-2 border-outline font-label-bold text-xs uppercase shadow-[2px_2px_0_0_var(--theme-outline)] cursor-pointer"
            >
              + Buat Kategori Sekarang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filtered.map((cat, idx) => {
              const colorClass = colors[idx % colors.length];
              const isFa = cat.icon && cat.icon.includes("fa-");

              const isFixed =
                cat.type === "expense" && isFixedExpenseCategory(cat);
              const isEssential =
                cat.type === "expense" &&
                !isFixed &&
                isEssentialExpenseCategory(cat);
              const isPrimaryIncome =
                cat.type === "income" && isEligibleIncomeCategory(cat);

              const badgeLabel =
                cat.type === "expense"
                  ? isFixed
                    ? "POS TETAP BULANAN"
                    : isEssential
                    ? "POS POKOK (100% PRIORITAS)"
                    : "POS SEKUNDER / VARIABEL"
                  : isPrimaryIncome
                  ? "PEMASUKAN UTAMA (SIKLUS GAJIAN)"
                  : "PEMASUKAN SAMPINGAN";

              const badgeStyle =
                cat.type === "expense"
                  ? isFixed
                    ? "bg-primary-container text-on-primary-container"
                    : isEssential
                    ? "bg-tertiary-container text-on-tertiary-container"
                    : "bg-secondary-container text-on-secondary-container"
                  : isPrimaryIncome
                  ? "bg-tertiary-container text-on-tertiary-container"
                  : "bg-surface-container-high text-on-surface";

              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  key={cat.id}
                  onClick={() => openEdit(cat)}
                  className="bg-background hover:bg-surface-bright rounded-2xl border-2 border-outline p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-[2px_2px_0_0_var(--theme-outline)] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl border-2 border-outline flex items-center justify-center shrink-0 ${colorClass}`}
                    >
                      {isFa ? (
                        <i className={`${cat.icon} text-lg`}></i>
                      ) : (
                        <span className="material-symbols-outlined text-xl">
                          {cat.icon || "category"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-label-bold text-sm sm:text-base text-on-surface font-extrabold truncate">
                        {cat.name}
                      </h4>
                      <span
                        className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-outline text-[10px] font-label-bold uppercase ${badgeStyle}`}
                      >
                        {badgeLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(cat);
                      }}
                      title="Edit Kategori"
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
                        handleDelete(cat);
                      }}
                      title="Hapus Kategori"
                      className="w-8 h-8 rounded-lg bg-error-container text-on-error-container border-2 border-outline flex items-center justify-center hover:opacity-90 active-press-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">
                        delete
                      </span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative bg-surface rounded-3xl w-full max-w-md p-6 border-[3px] border-outline shadow-[6px_6px_0_0_var(--theme-outline)] z-10 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="font-headline-lg text-on-background mb-5 tracking-tighter" style={{ WebkitTextStroke: '0.5px var(--theme-outline)' }}>
              {editData ? "Edit Kategori" : "Kategori Baru"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-on-surface-variant font-label-bold block mb-1.5 uppercase tracking-widest text-xs">Nama Kategori</label>
                <input
                  id="category-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Makanan & Minuman"
                  className="w-full bg-surface-container-lowest border-2 border-outline rounded-xl px-4 py-3 text-on-background font-body-md focus:outline-none focus:shadow-[2px_2px_0_0_var(--theme-outline)] transition-all"
                />
              </div>

              <div>
                <label className="text-on-surface-variant font-label-bold block mb-2 uppercase tracking-widest text-xs">Ikon Kategori</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 no-scrollbar">
                  {PRESET_ICONS.map((i) => (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`w-12 h-12 rounded-xl transition-all duration-150 flex items-center justify-center border-2 border-outline ${
                        icon === i ? "bg-primary-container text-on-primary-container shadow-[2px_2px_0_0_var(--theme-outline)] -translate-y-1 -translate-x-1" : "bg-surface text-on-surface-variant hover:bg-surface-bright"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[24px]">{i}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {tab === "expense" ? (
                <div className="bg-surface-container border-2 border-outline rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-on-surface-variant font-label-bold block uppercase tracking-widest text-xs">
                      Klasifikasi Smart Budget
                    </label>
                    <span className="text-[11px] font-medium text-on-surface-variant/80">
                      {expenseClassification === "auto" ? "Deteksi Otomatis" : "Diatur Manual"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      {
                        id: "auto",
                        label: "Otomatis",
                        desc: "Ikuti kata kunci sistem",
                        icon: "smart_toy",
                      },
                      {
                        id: "essential",
                        label: "Pokok",
                        desc: "Makan, bensin, sembako",
                        icon: "restaurant",
                      },
                      {
                        id: "fixed",
                        label: "Tetap",
                        desc: "Kos, listrik, wifi rutin",
                        icon: "home",
                      },
                      {
                        id: "variable",
                        label: "Sekunder",
                        desc: "Gaya hidup, hiburan, hobi",
                        icon: "sports_esports",
                      },
                    ].map((opt) => {
                      const isSelected = expenseClassification === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setExpenseClassification(opt.id as ExpenseClassification)}
                          className={`p-2.5 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
                            isSelected
                              ? "bg-primary-container text-on-primary-container border-outline shadow-[2px_2px_0_0_var(--theme-outline)] font-bold -translate-y-0.5"
                              : "bg-surface text-on-surface border-outline/40 hover:bg-surface-bright hover:border-outline"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
                            <span className="text-xs font-bold leading-none">{opt.label}</span>
                          </div>
                          <span className="text-[10px] leading-tight text-on-surface-variant opacity-85">
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-on-surface-variant pt-1 leading-relaxed">
                    {expenseClassification === "auto" &&
                      "Sistem otomatis mendeteksi kata kunci nama (contoh: 'makan'/'belanja' jadi Pokok, 'kos'/'listrik' jadi Tetap, sisanya Sekunder)."}
                    {expenseClassification === "essential" &&
                      "Kebutuhan pokok dilindungi dari pemangkasan saat budget menipis."}
                    {expenseClassification === "fixed" &&
                      "Pengeluaran tetap bulanan dikecualikan dari batas harian agar tidak memicu overbudget palsu."}
                    {expenseClassification === "variable" &&
                      "Pengeluaran sekunder / gaya hidup fleksibel dipangkas jika beban hutang tinggi."}
                  </p>
                </div>
              ) : (
                <div className="bg-surface-container border-2 border-outline rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-on-surface-variant font-label-bold block uppercase tracking-widest text-xs">
                      Peran dalam Smart Budget
                    </label>
                    <span className="text-[11px] font-medium text-on-surface-variant/80">
                      {incomeRole === "auto" ? "Deteksi Otomatis" : "Diatur Manual"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      {
                        id: "auto",
                        label: "Otomatis",
                        desc: "Kata kunci nama",
                        icon: "smart_toy",
                      },
                      {
                        id: "primary",
                        label: "Utama",
                        desc: "Dasar siklus & budget",
                        icon: "payments",
                      },
                      {
                        id: "secondary",
                        label: "Sampingan",
                        desc: "Di luar siklus rutin",
                        icon: "savings",
                      },
                    ].map((opt) => {
                      const isSelected = incomeRole === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setIncomeRole(opt.id as IncomeRole)}
                          className={`p-2.5 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
                            isSelected
                              ? "bg-primary-container text-on-primary-container border-outline shadow-[2px_2px_0_0_var(--theme-outline)] font-bold -translate-y-0.5"
                              : "bg-surface text-on-surface border-outline/40 hover:bg-surface-bright hover:border-outline"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
                            <span className="text-xs font-bold leading-none">{opt.label}</span>
                          </div>
                          <span className="text-[10px] leading-tight text-on-surface-variant opacity-85">
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-on-surface-variant pt-1 leading-relaxed">
                    {incomeRole === "auto" &&
                      "Sistem otomatis mendeteksi kata kunci nama (seperti gaji, salary, uang saku, atau uang bulanan)."}
                    {incomeRole === "primary" &&
                      "Pemasukan utama menjadi acuan penentuan tanggal siklus gaji/uang saku dan batas belanja harian."}
                    {incomeRole === "secondary" &&
                      "Pemasukan sampingan/tambahan tidak dijadikan patokan siklus bulanan rutin."}
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-error-container border-2 border-outline p-3 rounded-lg text-on-error-container font-label-bold text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl bg-surface border-2 border-outline text-on-background font-label-bold transition-all hover:bg-surface-bright active-press"
                >
                  Batal
                </button>
                <button
                  id="save-category"
                  onClick={handleSave}
                  disabled={formLoading}
                  className="flex-1 py-3 rounded-xl bg-primary-container border-2 border-outline text-on-primary-container font-label-bold transition-all disabled:opacity-50 active-press shadow-[2px_2px_0_0_var(--theme-outline)] hover:shadow-[4px_4px_0_0_var(--theme-outline)]"
                >
                  {formLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}
