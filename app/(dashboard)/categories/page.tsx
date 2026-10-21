"use client";

import { useCategories } from "@/hooks/useCategories";
import { CategoryManager } from "@/components/categories/CategoryManager";
import { motion } from "framer-motion";

export default function CategoriesPage() {
  const { categories, loading } = useCategories();

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full">
      <header className="mb-2">
        <h2 className="font-headline-lg text-2xl sm:text-3xl text-on-surface tracking-tight uppercase">
          KATEGORI
        </h2>
        <p className="font-body-md text-sm sm:text-base text-on-surface-variant mt-1">
          Atur pos pemasukan dan pengeluaran untuk mempermudah perhitungan anggaran.
        </p>
      </header>

      <CategoryManager categories={categories} loading={loading} />

      <motion.section whileHover={{ scale: 1.02 }} className="w-full rounded-3xl border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] bg-surface-container-highest p-6 relative overflow-hidden mt-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h4 className="font-headline-md text-on-background text-xl font-bold uppercase">Tips Keuangan</h4>
            <p className="font-body-md text-on-surface-variant font-bold">
              Pengelompokan kategori yang rapi membantu alokasi anggaran dan pengeluaran harian Anda lebih terarah.
            </p>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 border-[4px] border-on-background rounded-full opacity-10 pointer-events-none"></div>
      </motion.section>
    </div>
  );
}
