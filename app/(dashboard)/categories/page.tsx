"use client";

import { useCategories } from "@/hooks/useCategories";
import { CategoryManager } from "@/components/categories/CategoryManager";

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
      <section className="w-full rounded-lg neo-brutalist-border bg-surface-container-highest p-6 relative overflow-hidden mt-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h4 className="font-headline-md text-on-background">Fun Fact</h4>
            <p className="font-body-md text-on-surface-variant">
              Custom categories let you track your guilty pleasures perfectly. 🍔🎮
            </p>
          </div>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 border-[3px] border-on-background rounded-full opacity-10 pointer-events-none"></div>
      </section>
    </div>
  );
}
