"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useCallback } from "react";
import type { Account } from "@/lib/services/accounts";

export function useAccounts(initialAccounts: Account[] = []) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setAccounts(data);
    setLoading(false);
  }, [supabase]);

  return { accounts, setAccounts, loading, refresh };
}
