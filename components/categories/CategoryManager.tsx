"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Category, addCategory, updateCategory, deleteCategory } from "@/lib/firestore/categories";
import { TransactionType } from "@/lib/firestore/transactions";

interface CategoryManagerProps {
  categories: Category[];
  loading: boolean;
}

const PRESET_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#0ea5e9",
  "#84cc16", "#a855f7",
];

export function CategoryManager({ categories, loading }: CategoryManagerProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<TransactionType>("expense");
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const filtered = categories.filter((c) => c.type === tab);

  const openAdd = () => {
    setEditData(null);
    setName("");
    setColor(PRESET_COLORS[0]);
    setError("");
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditData(cat);
    setName(cat.name);
    setColor(cat.color);
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) { setError("Nama kategori harus diisi"); return; }
    setFormLoading(true);
    setError("");
    try {
      if (editData) {
        await updateCategory(user.uid, editData.id, { name: name.trim(), color });
      } else {
        await addCategory(user.uid, { name: name.trim(), type: tab, color, icon: "circle" });
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
      <div className="flex bg-slate-800/60 rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab("expense")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === "expense"
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Pengeluaran
        </button>
        <button
          onClick={() => setTab("income")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === "income"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Pemasukan
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Add Button */}
          <button
            id="add-category-btn"
            onClick={openAdd}
            className="flex flex-col items-center justify-center gap-2 h-20 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-500 hover:text-emerald-400 transition-all duration-200"
          >
            <Plus size={20} />
            <span className="text-xs font-medium">Tambah</span>
          </button>

          {filtered.map((cat) => (
            <div
              key={cat.id}
              className="group relative flex flex-col items-center justify-center gap-2 h-20 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-200 px-3"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-white text-xs font-medium text-center truncate w-full text-center">
                {cat.name}
              </span>
              {cat.isDefault && (
                <span className="text-slate-600 text-[9px]">default</span>
              )}

              {/* Mobile Actions (Always visible on mobile, hidden on desktop) */}
              <div className="absolute top-1.5 right-1.5 flex gap-1 lg:hidden z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(cat); }}
                  className="w-6 h-6 rounded bg-slate-800/80 active:bg-slate-700 text-slate-400 active:text-white flex items-center justify-center transition-all"
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(cat); }}
                  className="w-6 h-6 rounded bg-slate-800/80 active:bg-rose-500/20 text-slate-400 active:text-rose-400 flex items-center justify-center transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </div>

              {/* Desktop Hover actions (Hidden on mobile) */}
              <div className="hidden lg:flex absolute inset-0 rounded-2xl bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2">
                <button
                  onClick={() => openEdit(cat)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all"
                >
                  <Trash2 size={14} />
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
          <div className="relative bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-white font-semibold mb-5">
              {editData ? "Edit Kategori" : "Tambah Kategori"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-medium block mb-1.5">Nama</label>
                <input
                  id="category-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama kategori"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs font-medium block mb-2">Warna</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all duration-150 ${
                        color === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : "opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-xs">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm transition-all hover:text-white"
                >
                  Batal
                </button>
                <button
                  id="save-category"
                  onClick={handleSave}
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all disabled:opacity-50"
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
