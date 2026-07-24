import { createServer } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type Investment = Tables<"investments">;

export async function getInvestments() {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("investments")
    .select("*, accounts(nome)")
    .order("nome");
  if (error) throw error;
  return data;
}

export async function createInvestment(values: Omit<Investment, "id" | "user_id" | "atualizado_em">) {
  const supabase = await createServer();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("investments")
    .insert({ ...values, user_id: user.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInvestment(id: string, values: Partial<Omit<Investment, "id" | "user_id">>) {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("investments")
    .update({ ...values, atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInvestment(id: string) {
  const supabase = await createServer();
  const { error } = await supabase.from("investments").delete().eq("id", id);
  if (error) throw error;
}
