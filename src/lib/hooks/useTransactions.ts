"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useCallback } from "react";
import type { Transaction } from "@/lib/services/transactions";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const refresh = useCallback(
    async (filters?: {
      month?: string;
      tipo?: string;
      accountId?: string;
      categoryId?: string;
    }) => {
      setLoading(true);
      let query = supabase
        .from("transactions")
        .select("*, categories(nome, cor, icone), accounts(nome)")
        .order("data", { ascending: false });

      if (filters?.tipo && filters.tipo !== "all") {
        query = query.eq("tipo", filters.tipo);
      }
      if (filters?.month) {
        const start = `${filters.month}-01`;
        const [year, month] = filters.month.split("-");
        const lastDay = new Date(Number(year), Number(month), 0).getDate();
        const end = `${filters.month}-${String(lastDay).padStart(2, "0")}`;
        query = query.gte("data", start).lte("data", end);
      }
      if (filters?.accountId) {
        query = query.eq("account_id", filters.accountId);
      }
      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }

      const { data } = await query;
      if (data) setTransactions(data);
      setLoading(false);
    },
    [supabase],
  );

  return { transactions, loading, refresh };
}
