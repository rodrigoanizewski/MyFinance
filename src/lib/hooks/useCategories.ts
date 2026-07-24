"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useCallback } from "react";
import type { Category } from "@/lib/services/categories";

export function useCategories(initialCategories: Category[] = []) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("nome", { ascending: true });
    if (data) setCategories(data);
    setLoading(false);
  }, [supabase]);

  return { categories, setCategories, loading, refresh };
}
