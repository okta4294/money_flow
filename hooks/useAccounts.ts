import { useState, useEffect } from "react";
import { Account, subscribeToAccounts } from "@/lib/firestore/accounts";
import { useAuth } from "@/lib/auth-context";

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToAccounts(user.uid, (data) => {
      setAccounts(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { accounts, loading };
}
