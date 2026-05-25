"use client";

import { useCategories } from "@/hooks/useCategories";
import { CategoryManager } from "@/components/categories/CategoryManager";

export default function CategoriesPage() {
  const { categories, loading } = useCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Kategori</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Kelola kategori pemasukan dan pengeluaran Anda
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3 text-blue-300 text-sm">
        💡 Kategori default telah disiapkan untuk Anda. Anda bisa menambah atau mengedit sesuai kebutuhan.
      </div>

      <CategoryManager categories={categories} loading={loading} />
    </div>
  );
}
