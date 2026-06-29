"use client";

import { useCategories } from "@/hooks/useCategories";
import { CategoryManager } from "@/components/categories/CategoryManager";
import { motion } from "framer-motion";

export default function CategoriesPage() {
  const { categories, loading } = useCategories();

  return (
    <div className="space-y-8 max-w-2xl mx-auto w-full">
      {/* Header Section */}
      <section className="space-y-2">
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-on-background">Categories</h2>
        <p className="font-body-md text-on-surface-variant">Where did the cash go? Tap a category to edit details.</p>
      </section>

      {/* Category Manager */}
      <CategoryManager categories={categories} loading={loading} />

      {/* Fun Stat Card */}
      <motion.section whileHover={{ scale: 1.02 }} className="w-full rounded-3xl border-4 border-outline shadow-[4px_4px_0_0_var(--theme-outline)] bg-surface-container-highest p-6 relative overflow-hidden mt-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h4 className="font-headline-md text-on-background text-xl font-bold uppercase">Fun Fact</h4>
            <p className="font-body-md text-on-surface-variant font-bold">
              Custom categories let you track your guilty pleasures perfectly. 🍔🎮
            </p>
          </div>
        </div>
        {/* Decorative circle */}
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute -right-10 -bottom-10 w-40 h-40 border-[4px] border-on-background rounded-full opacity-10 pointer-events-none"></motion.div>
      </motion.section>
    </div>
  );
}
