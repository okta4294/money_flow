"use client";

import { useCategories } from "@/hooks/useCategories";
import { CategoryManager } from "@/components/categories/CategoryManager";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";

export default function CategoriesPage() {
  const { categories, loading } = useCategories();

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Kategori Pos"
        subtitle="Atur pemasukan & pengeluaran untuk perhitungan anggaran otomatis."
        className="mb-0"
      />

      <CategoryManager categories={categories} loading={loading} />
    </div>
  );
}
