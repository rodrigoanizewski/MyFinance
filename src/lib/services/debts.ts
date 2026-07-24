import { createServer } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type Debt = Tables<"debts">;

export async function getDebts() {
  const supabase = await createServer();
  const { data, error } = await supabase.from("debts").select("*").order("vencimento");
  if (error) throw error;
  return data;
}

export async function createDebt(values: Omit<Debt, "id" | "user_id">) {
  const supabase = await createServer();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("debts")
    .insert({ ...values, user_id: user.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDebt(id: string, values: Partial<Omit<Debt, "id" | "user_id">>) {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("debts")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDebt(id: string) {
  const supabase = await createServer();
  const { error } = await supabase.from("debts").delete().eq("id", id);
  if (error) throw error;
}
