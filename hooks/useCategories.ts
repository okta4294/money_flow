"use client";

import { useGlobalData } from "@/lib/data-context";

export function useCategories() {
  const { categories, categoriesLoading: loading } = useGlobalData();
  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return { categories, incomeCategories, expenseCategories, loading };
}
