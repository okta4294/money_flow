"use client";

import { createContext, useContext, useEffect, useState, useMemo, useRef, ReactNode } from "react";
import { useAuth } from "./auth-context";
import { subscribeToCategories, Category, isDebtCategoryName, ensureDebtCategoryExists } from "./firestore/categories";
import { subscribeToAccounts, Account } from "./firestore/accounts";
import { subscribeToDebts, Debt } from "./firestore/debts";
import { subscribeToMonthlySavings, setMonthlySaving as firestoreSetMonthlySaving, MonthlySaving } from "./firestore/savings";
import { subscribeToUserSettings, updateUserSettings, BudgetSource, BudgetCalculationMode } from "./firestore/user-settings";

export type { BudgetSource, BudgetCalculationMode, MonthlySaving };

interface DataContextType {
  categories: Category[];
  categoriesLoading: boolean;
  accounts: Account[];
  accountsLoading: boolean;
  debts: Debt[];
  debtsLoading: boolean;
  monthlySavings: MonthlySaving[];
  monthlySavingsLoading: boolean;
  saveMonthlySaving: (year: number, month: number, target: number) => Promise<void>;
  budgetSource: BudgetSource;
  setBudgetSource: (source: BudgetSource) => Promise<void>;
  budgetCalculationMode: BudgetCalculationMode;
  setBudgetCalculationMode: (mode: BudgetCalculationMode) => Promise<void>;
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

  const [monthlySavings, setMonthlySavings] = useState<MonthlySaving[]>([]);
  const [monthlySavingsLoading, setMonthlySavingsLoading] = useState(true);

  const [budgetSource, setBudgetSourceState] = useState<BudgetSource>("all_income");
  const [budgetCalculationMode, setBudgetCalculationModeState] = useState<BudgetCalculationMode>("adaptive");

  const isAutoCreatingCategoryRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setCategoriesLoading(false);
      setAccounts([]);
      setAccountsLoading(false);
      setDebts([]);
      setDebtsLoading(false);
      setMonthlySavings([]);
      setMonthlySavingsLoading(false);
      setBudgetSourceState("all_income");
      setBudgetCalculationModeState("adaptive");
      return;
    }

    setCategoriesLoading(true);
    setAccountsLoading(true);
    setDebtsLoading(true);
    setMonthlySavingsLoading(true);

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

    const unsubSavings = subscribeToMonthlySavings(user.uid, (data) => {
      setMonthlySavings(data);
      setMonthlySavingsLoading(false);
    });

    const unsubSettings = subscribeToUserSettings(user.uid, (settings) => {
      setBudgetSourceState(settings.budgetSource || "all_income");
      setBudgetCalculationModeState(settings.budgetCalculationMode || "adaptive");
    });

    return () => {
      unsubCat();
      unsubAcc();
      unsubDebt();
      unsubSavings();
      unsubSettings();
    };
  }, [user?.uid]);

  const saveMonthlySaving = async (year: number, month: number, target: number) => {
    if (!user) return;
    try {
      await firestoreSetMonthlySaving(user.uid, year, month, target);
    } catch (err) {
      console.error("Gagal menyimpan target tabungan:", err);
      throw err;
    }
  };

  const setBudgetSource = async (source: BudgetSource) => {
    setBudgetSourceState(source);
    if (user) {
      try {
        await updateUserSettings(user.uid, { budgetSource: source });
      } catch (err) {
        console.error("Gagal menyimpan preferensi budgetSource:", err);
      }
    }
  };

  const setBudgetCalculationMode = async (mode: BudgetCalculationMode) => {
    setBudgetCalculationModeState(mode);
    if (user) {
      try {
        await updateUserSettings(user.uid, { budgetCalculationMode: mode });
      } catch (err) {
        console.error("Gagal menyimpan preferensi budgetCalculationMode:", err);
      }
    }
  };

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
    monthlySavings, monthlySavingsLoading,
    saveMonthlySaving,
    budgetSource,
    setBudgetSource,
    budgetCalculationMode,
    setBudgetCalculationMode,
  }), [categories, categoriesLoading, accounts, accountsLoading, debts, debtsLoading, monthlySavings, monthlySavingsLoading, budgetSource, budgetCalculationMode]);

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
