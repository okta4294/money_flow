"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./auth-context";
import { subscribeToCategories, Category } from "./firestore/categories";
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

  return (
    <DataContext.Provider value={{
      categories, categoriesLoading,
      accounts, accountsLoading,
      debts, debtsLoading
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useGlobalData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useGlobalData must be used within DataProvider");
  return ctx;
}
