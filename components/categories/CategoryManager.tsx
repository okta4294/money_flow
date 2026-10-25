"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Category, addCategory, updateCategory, deleteCategory } from "@/lib/firestore/categories";
import { TransactionType } from "@/lib/firestore/transactions";
import {
  isFixedExpenseCategory,
  isEssentialExpenseCategory,
} from "@/lib/budget-calculator";
import { motion, AnimatePresence } from "framer-motion";

interface CategoryManagerProps {
  categories: Category[];
  loading: boolean;
}

type ExpenseClassification = "auto" | "essential" | "fixed" | "variable";

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
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const filtered = categories.filter((c) => c.type === tab);

  const openAdd = () => {
    setEditData(null);
    setName("");
    setIcon(PRESET_ICONS[0]);
    setExpenseClassification("auto");
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
          ? {}
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

  return (
    <div>
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setTab("expense")}
          className={`px-6 py-3 font-label-bold rounded-full transition-all whitespace-nowrap neo-brutalist-border ${
            tab === "expense"
              ? "bg-primary-container text-on-primary-container neo-brutalist-shadow-sm active-press"
              : "bg-surface text-on-background hover:bg-surface-bright active-press"
          }`}
        >
          Pengeluaran
        </button>
        <button
          onClick={() => setTab("income")}
          className={`px-6 py-3 font-label-bold rounded-full transition-all whitespace-nowrap neo-brutalist-border ${
            tab === "income"
              ? "bg-primary-container text-on-primary-container neo-brutalist-shadow-sm active-press"
              : "bg-surface text-on-background hover:bg-surface-bright active-press"
          }`}
        >
          Pemasukan
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-surface-bright neo-brutalist-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <button
            id="add-category-btn"
            onClick={openAdd}
            className="aspect-square rounded-lg border-[3px] border-dashed border-on-background bg-surface hover:bg-surface-bright flex flex-col justify-center items-center text-center transition-all duration-200 active-press"
          >
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">add</span>
            <span className="font-label-bold text-on-surface-variant">Tambah</span>
          </button>

          {filtered.map((cat, idx) => {
            const colorClass = colors[idx % colors.length];
            const isFa = cat.icon && cat.icon.includes("fa-");
            
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.03, rotate: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                key={cat.id}
                onClick={() => openEdit(cat)}
                className={`group relative aspect-square rounded-2xl border-4 border-outline p-4 md:p-6 flex flex-col justify-between items-start text-left shadow-[4px_4px_0_0_var(--theme-outline)] hover:shadow-[6px_6px_0_0_var(--theme-outline)] transition-all cursor-pointer ${colorClass}`}
              >
                <div className="w-12 h-12 bg-white neo-brutalist-border rounded-xl flex items-center justify-center">
                  {isFa ? (
                    <i className={`${cat.icon} text-black text-xl`}></i>
                  ) : (
                    <span className="material-symbols-outlined text-black">{cat.icon || "category"}</span>
                  )}
                </div>
                
                <div className="w-full">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {cat.isDefault && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-on-background text-background px-2 py-0.5 rounded-sm inline-block">
                        BAWAAN
                      </span>
                    )}
                    {cat.type === "expense" && (() => {
                      const isFixed = isFixedExpenseCategory(cat);
                      const isEssential = !isFixed && isEssentialExpenseCategory(cat);
                      const classification = isFixed ? "TETAP" : isEssential ? "POKOK" : "SEKUNDER";
                      const isManual = typeof cat.isFixedExpense === "boolean" || typeof cat.isEssentialExpense === "boolean";
                      return (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm inline-flex items-center gap-1 ${
                            classification === "TETAP"
                              ? "bg-amber-400 text-slate-950 dark:bg-amber-300 dark:text-slate-950"
                              : classification === "POKOK"
                              ? "bg-emerald-500 text-white dark:bg-emerald-400 dark:text-slate-950"
                              : "bg-surface-container-high text-on-surface-variant border border-outline/30"
                          }`}
                        >
                          {classification}
                          {isManual && <span className="text-[8px] opacity-75 font-normal">MANUAL</span>}
                        </span>
                      );
                    })()}
                  </div>
                  <h3 className="font-headline-md text-lg leading-tight line-clamp-2">
                    {cat.name}
                  </h3>
                </div>

                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(cat); }}
                    className="w-8 h-8 rounded-lg bg-white neo-brutalist-border text-black flex items-center justify-center hover:bg-slate-200 active-press"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(cat); }}
                    className="w-8 h-8 rounded-lg bg-error text-on-error neo-brutalist-border flex items-center justify-center hover:opacity-90 active-press"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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

              {tab === "expense" && (
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
