import { createServer } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type Transaction = Tables<"transactions">;

export async function getTransactions(filters?: {
  month?: string; // YYYY-MM
  tipo?: "receita" | "despesa" | "transferencia";
  accountId?: string;
  categoryId?: string;
}) {
  const supabase = await createServer();
  let query = supabase
    .from("transactions")
    .select("*, categories(nome, cor, icone), accounts(nome)")
    .order("data", { ascending: false });

  if (filters?.tipo) {
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

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getTransaction(id: string) {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories(nome, cor, icone), accounts(nome)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createTransaction(
  values: Omit<Tables<"transactions">, "id" | "user_id">,
) {
  const supabase = await createServer();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("transactions")
    .insert({ ...values, user_id: user.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTransaction(
  id: string,
  values: Partial<Omit<Tables<"transactions">, "id" | "user_id">>,
) {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("transactions")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: string) {
  const supabase = await createServer();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}
