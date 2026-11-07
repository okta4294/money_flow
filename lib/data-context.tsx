"use client";

import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback, ReactNode } from "react";
import { useAuth } from "./auth-context";
import { subscribeToCategories, Category, isDebtCategoryName, ensureDebtCategoryExists } from "./firestore/categories";
import { subscribeToAccounts, Account, getAccountBalances } from "./firestore/accounts";
import { subscribeToDebts, Debt } from "./firestore/debts";
import { subscribeToMonthlySavings, setMonthlySaving as firestoreSetMonthlySaving, addSavingsWithdrawal as firestoreAddSavingsWithdrawal, deleteSavingsWithdrawal as firestoreDeleteSavingsWithdrawal, MonthlySaving, SavingsWithdrawal } from "./firestore/savings";
import { updateUserSettings, BudgetSource, BudgetCalculationMode } from "./firestore/user-settings";
import { subscribeToTransactionMutations } from "./firestore/transactions";

export type { BudgetSource, BudgetCalculationMode, MonthlySaving, SavingsWithdrawal };

interface DataContextType {
  categories: Category[];
  categoriesLoading: boolean;
  accounts: Account[];
  accountsLoading: boolean;
  accountBalances: Record<string, number>;
  totalAccountBalance: number;
  accountBalancesLoading: boolean;
  refreshAccountBalances: () => Promise<void>;
  debts: Debt[];
  debtsLoading: boolean;
  monthlySavings: MonthlySaving[];
  savingsWithdrawals: SavingsWithdrawal[];
  monthlySavingsLoading: boolean;
  saveMonthlySaving: (year: number, month: number, target: number) => Promise<void>;
  addSavingsWithdrawal: (data: { amount: number; date?: string; note?: string }) => Promise<void>;
  deleteSavingsWithdrawal: (id: string) => Promise<void>;
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
  const [accountBalances, setAccountBalances] = useState<Record<string, number>>({});
  const [accountBalancesLoading, setAccountBalancesLoading] = useState(true);
  
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtsLoading, setDebtsLoading] = useState(true);

  const [monthlySavings, setMonthlySavings] = useState<MonthlySaving[]>([]);
  const [savingsWithdrawals, setSavingsWithdrawals] = useState<SavingsWithdrawal[]>([]);
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
      setAccountBalances({});
      setAccountBalancesLoading(false);
      setDebts([]);
      setDebtsLoading(false);
      setMonthlySavings([]);
      setSavingsWithdrawals([]);
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

    // Satu listener tunggal untuk dokumen users/{userId} (tabungan + pengaturan anggaran)
    const unsubSavingsAndSettings = subscribeToMonthlySavings(
      user.uid,
      (data, withdrawals, settings) => {
        setMonthlySavings(data);
        setSavingsWithdrawals(withdrawals || []);
        setMonthlySavingsLoading(false);
        if (settings) {
          setBudgetSourceState(settings.budgetSource || "all_income");
          setBudgetCalculationModeState(settings.budgetCalculationMode || "adaptive");
        }
      }
    );

    return () => {
      unsubCat();
      unsubAcc();
      unsubDebt();
      unsubSavingsAndSettings();
    };
  }, [user?.uid]);

  const accountIdsKey = useMemo(() => accounts.map((a) => a.id).join(","), [accounts]);

  const refreshAccountBalances = useCallback(async () => {
    if (!user) {
      setAccountBalances({});
      setAccountBalancesLoading(false);
      return;
    }
    if (accountsLoading) return;
    const ids = accountIdsKey ? accountIdsKey.split(",") : [];
    if (ids.length === 0) {
      setAccountBalances({});
      setAccountBalancesLoading(false);
      return;
    }
    setAccountBalancesLoading(true);
    try {
      const records = await getAccountBalances(user.uid, ids);
      setAccountBalances(records);
    } catch (err) {
      console.error("Gagal memuat saldo akun terpusat:", err);
    } finally {
      setAccountBalancesLoading(false);
    }
  }, [user?.uid, accountsLoading, accountIdsKey]);

  useEffect(() => {
    refreshAccountBalances();
  }, [refreshAccountBalances]);

  useEffect(() => {
    if (!user) return;
    return subscribeToTransactionMutations(user.uid, () => {
      refreshAccountBalances();
    });
  }, [user?.uid, refreshAccountBalances]);

  const totalAccountBalance = useMemo(
    () => Object.values(accountBalances).reduce((sum, val) => sum + val, 0),
    [accountBalances]
  );

  const saveMonthlySaving = async (year: number, month: number, target: number) => {
    if (!user) return;
    try {
      await firestoreSetMonthlySaving(user.uid, year, month, target);
    } catch (err) {
      console.error("Gagal menyimpan target tabungan:", err);
      throw err;
    }
  };

  const addSavingsWithdrawal = async (data: { amount: number; date?: string; note?: string }) => {
    if (!user) return;
    try {
      await firestoreAddSavingsWithdrawal(user.uid, data);
    } catch (err) {
      console.error("Gagal mencatat penarikan tabungan:", err);
      throw err;
    }
  };

  const deleteSavingsWithdrawal = async (id: string) => {
    if (!user) return;
    try {
      await firestoreDeleteSavingsWithdrawal(user.uid, id);
    } catch (err) {
      console.error("Gagal menghapus catatan penarikan tabungan:", err);
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
    accountBalances, totalAccountBalance, accountBalancesLoading, refreshAccountBalances,
    debts, debtsLoading,
    monthlySavings, savingsWithdrawals, monthlySavingsLoading,
    saveMonthlySaving,
    addSavingsWithdrawal,
    deleteSavingsWithdrawal,
    budgetSource,
    setBudgetSource,
    budgetCalculationMode,
    setBudgetCalculationMode,
  }), [categories, categoriesLoading, accounts, accountsLoading, accountBalances, totalAccountBalance, accountBalancesLoading, refreshAccountBalances, debts, debtsLoading, monthlySavings, savingsWithdrawals, monthlySavingsLoading, budgetSource, budgetCalculationMode]);

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
