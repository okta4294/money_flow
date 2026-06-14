"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Category, addCategory, updateCategory, deleteCategory } from "@/lib/firestore/categories";
import { TransactionType } from "@/lib/firestore/transactions";

interface CategoryManagerProps {
  categories: Category[];
  loading: boolean;
}

const PRESET_ICONS = [
  "fa-solid fa-basket-shopping",
  "fa-solid fa-house",
  "fa-solid fa-car",
  "fa-solid fa-utensils",
  "fa-solid fa-bolt",
  "fa-solid fa-gamepad",
  "fa-solid fa-heart",
  "fa-solid fa-graduation-cap",
  "fa-solid fa-plane",
  "fa-solid fa-wallet",
  "fa-solid fa-money-bill-wave",
  "fa-solid fa-piggy-bank",
  "fa-solid fa-chart-line",
  "fa-solid fa-briefcase",
  "fa-solid fa-gift",
  "fa-solid fa-hospital",
  "fa-solid fa-shirt",
  "fa-solid fa-music",
  "fa-solid fa-mobile-screen",
  "fa-solid fa-dumbbell",
];

export function CategoryManager({ categories, loading }: CategoryManagerProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<TransactionType>("expense");
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(PRESET_ICONS[0]);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const filtered = categories.filter((c) => c.type === tab);

  const openAdd = () => {
    setEditData(null);
    setName("");
    setIcon(PRESET_ICONS[0]);
    setError("");
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditData(cat);
    setName(cat.name);
    setIcon(cat.icon && cat.icon.includes("fa-") ? cat.icon : PRESET_ICONS[0]);
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) { setError("Nama kategori harus diisi"); return; }
    setFormLoading(true);
    setError("");
    try {
      if (editData) {
        await updateCategory(user.uid, editData.id, { name: name.trim(), icon });
      } else {
        await addCategory(user.uid, { name: name.trim(), type: tab, icon, color: "#00dce5" });
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

  return (
    <div>
      {/* Tab */}
      <div className="flex glass-panel rounded-xl p-1 mb-6 border border-white/5">
        <button
          onClick={() => setTab("expense")}
          className={`flex-1 py-2 font-label-md rounded-lg transition-all ${
            tab === "expense"
              ? "bg-secondary-container/80 text-on-secondary-container border border-secondary-container/50 shadow-[0_0_12px_rgba(96,1,209,0.4)]"
              : "text-on-surface-variant hover:text-white"
          }`}
        >
          Pengeluaran
        </button>
        <button
          onClick={() => setTab("income")}
          className={`flex-1 py-2 font-label-md rounded-lg transition-all ${
            tab === "income"
              ? "bg-secondary-container/80 text-on-secondary-container border border-secondary-container/50 shadow-[0_0_12px_rgba(96,1,209,0.4)]"
              : "text-on-surface-variant hover:text-white"
          }`}
        >
          Pemasukan
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl glass-panel animate-pulse border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Add Button */}
          <button
            id="add-category-btn"
            onClick={openAdd}
            className="flex flex-col items-center justify-center gap-2 h-20 rounded-2xl border-2 border-dashed border-white/20 hover:border-primary-fixed/50 hover:bg-primary-fixed/5 text-on-surface-variant hover:text-primary-fixed transition-all duration-200"
          >
            <i className="fa-solid fa-plus text-xl"></i>
            <span className="font-label-sm">Tambah</span>
          </button>

          {filtered.map((cat) => (
            <div
              key={cat.id}
              className="group relative flex flex-col items-center justify-center gap-2 h-20 rounded-2xl glass-panel border border-white/5 hover:border-white/20 transition-all duration-200 px-3"
            >
              <i className={`${cat.icon && cat.icon.includes("fa-") ? cat.icon : "fa-solid fa-circle"} text-2xl text-primary-fixed drop-shadow-[0_0_8px_rgba(99,247,255,0.4)]`}></i>
              <span className="text-white font-label-md text-center truncate w-full">
                {cat.name}
              </span>
              {cat.isDefault && (
                <span className="text-on-surface-variant text-[9px]">default</span>
              )}

              {/* Mobile Actions (Always visible on mobile, hidden on desktop) */}
              <div className="absolute top-1.5 right-1.5 flex gap-1 lg:hidden z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(cat); }}
                  className="w-6 h-6 rounded bg-surface-container-high/80 active:bg-surface-variant text-on-surface-variant active:text-white flex items-center justify-center transition-all border border-white/5"
                >
                  <i className="fa-solid fa-pencil text-[11px]"></i>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(cat); }}
                  className="w-6 h-6 rounded bg-surface-container-high/80 active:bg-error/20 text-on-surface-variant active:text-error flex items-center justify-center transition-all border border-white/5"
                >
                  <i className="fa-solid fa-trash text-[11px]"></i>
                </button>
              </div>

              {/* Desktop Hover actions (Hidden on mobile) */}
              <div className="hidden lg:flex absolute inset-0 rounded-2xl bg-surface/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2 border border-white/10">
                <button
                  onClick={() => openEdit(cat)}
                  className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface-variant hover:text-white flex items-center justify-center transition-all border border-white/5"
                >
                  <i className="fa-solid fa-pencil text-[14px]"></i>
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-error/20 text-on-surface-variant hover:text-error flex items-center justify-center transition-all border border-white/5"
                >
                  <i className="fa-solid fa-trash text-[14px]"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative glass-panel rounded-2xl w-full max-w-sm p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10">
            <h3 className="font-headline-md text-white mb-5">
              {editData ? "Edit Kategori" : "Tambah Kategori"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-on-surface-variant font-label-sm block mb-1.5">Nama</label>
                <input
                  id="category-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama kategori"
                  className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3 text-white font-body-md focus:outline-none focus:border-primary-fixed focus:ring-1 focus:ring-primary-fixed/30 transition-all placeholder-on-surface-variant/50"
                />
              </div>

              <div>
                <label className="text-on-surface-variant font-label-sm block mb-2">Ikon</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`w-10 h-10 rounded-full transition-all duration-150 flex items-center justify-center ${
                        icon === i ? "bg-primary-fixed/20 border border-primary-fixed text-primary-fixed shadow-[0_0_10px_rgba(99,247,255,0.3)] scale-110" : "bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <i className={`${i} text-lg`}></i>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-error font-label-sm">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-on-surface-variant font-label-md transition-all hover:text-white hover:bg-white/5"
                >
                  Batal
                </button>
                <button
                  id="save-category"
                  onClick={handleSave}
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-secondary-container to-primary-fixed hover:opacity-90 text-white font-label-md transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(99,247,255,0.3)]"
                >
                  {formLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
