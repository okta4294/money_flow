"use client";

import { useGlobalData } from "@/lib/data-context";

export function useAccounts() {
  const { accounts, accountsLoading: loading } = useGlobalData();
  return { accounts, loading };
}
