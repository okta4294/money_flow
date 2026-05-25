"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  subscribeToCategories,
  Category,
  seedDefaultCategories,
} from "@/lib/firestore/categories";

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    // Seed default categories for new users
    seedDefaultCategories(user.uid);

    setLoading(true);
    const unsubscribe = subscribeToCategories(user.uid, (data) => {
      setCategories(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return { categories, incomeCategories, expenseCategories, loading };
}
