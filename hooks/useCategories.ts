"use client";

import { useMemo } from "react";
import { useGlobalData } from "@/lib/data-context";

export function useCategories() {
  const { categories, categoriesLoading: loading } = useGlobalData();

  const { incomeCategories, expenseCategories } = useMemo(() => ({
    incomeCategories: categories.filter((c) => c.type === "income"),
    expenseCategories: categories.filter((c) => c.type === "expense"),
  }), [categories]);

  return { categories, incomeCategories, expenseCategories, loading };
}
