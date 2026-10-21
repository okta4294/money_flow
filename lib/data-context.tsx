"use client";

import { createContext, useContext, useEffect, useState, useMemo, useRef, ReactNode } from "react";
import { useAuth } from "./auth-context";
import { subscribeToCategories, Category, isDebtCategoryName, ensureDebtCategoryExists } from "./firestore/categories";
import { subscribeToAccounts, Account } from "./firestore/accounts";
import { subscribeToDebts, Debt } from "./firestore/debts";

interface DataContextType {
  categories: Category[];
  categoriesLoading: boolean;
  accounts: Account[];
  accountsLoading: boolean;
  debts: Debt[];
  debtsLoading: boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtsLoading, setDebtsLoading] = useState(true);

  const isAutoCreatingCategoryRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setCategoriesLoading(false);
      setAccounts([]);
      setAccountsLoading(false);
      setDebts([]);
      setDebtsLoading(false);
      return;
    }

    setCategoriesLoading(true);
    setAccountsLoading(true);
    setDebtsLoading(true);

    const unsubCat = subscribeToCategories(user.uid, (data) => {
      setCategories(data);
      setCategoriesLoading(false);
    });

    const unsubAcc = subscribeToAccounts(user.uid, (data) => {
      setAccounts(data);
      setAccountsLoading(false);
    });

    const unsubDebt = subscribeToDebts(user.uid, (data) => {
      setDebts(data);
      setDebtsLoading(false);
    });

    return () => {
      unsubCat();
      unsubAcc();
      unsubDebt();
    };
  }, [user?.uid]);

  // Otomatis membuatkan kategori hutang jika user memiliki hutang namun kategori hutang belum ada
  useEffect(() => {
    if (!user || categoriesLoading || debtsLoading) return;

    const hasDebt = debts.some((d) => d.status === "active" || d.remainingAmount > 0);
    const hasDebtCategory = categories.some(
      (c) => c.type === "expense" && isDebtCategoryName(c.name)
    );

    if (hasDebt && !hasDebtCategory && !isAutoCreatingCategoryRef.current) {
      isAutoCreatingCategoryRef.current = true;
      ensureDebtCategoryExists(user.uid, categories)
        .catch((err) => {
          console.error("Gagal membuat kategori hutang otomatis:", err);
        })
        .finally(() => {
          setTimeout(() => {
            isAutoCreatingCategoryRef.current = false;
          }, 3000);
        });
    }
  }, [user, categories, debts, categoriesLoading, debtsLoading]);

  const value = useMemo(() => ({
    categories, categoriesLoading,
    accounts, accountsLoading,
    debts, debtsLoading,
  }), [categories, categoriesLoading, accounts, accountsLoading, debts, debtsLoading]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useGlobalData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useGlobalData must be used within DataProvider");
  return ctx;
}
