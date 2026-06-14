"use client";

import { useCategories } from "@/hooks/useCategories";
import { CategoryManager } from "@/components/categories/CategoryManager";

export default function CategoriesPage() {
  const { categories, loading } = useCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg-mobile md:font-headline-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-primary-fixed/70">Kategori</h1>
        <p className="font-body-md text-on-surface-variant mt-1">
          Kelola kategori pemasukan dan pengeluaran Anda
        </p>
      </div>

      {/* Info Banner */}
      <div className="glass-panel border-l-4 border-l-primary-fixed rounded-xl px-4 py-3 text-on-surface-variant font-body-md">
        💡 Buat kategori sesuai kebutuhan Anda. Tambahkan kategori pemasukan dan pengeluaran sendiri.
      </div>

      <CategoryManager categories={categories} loading={loading} />
    </div>
  );
}
