import { createServer } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/types/database";

export type Account = Tables<"accounts">;

export async function getAccounts() {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getAccount(id: string) {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createAccount(
  values: Omit<Account, "id" | "user_id" | "created_at">,
) {
  const supabase = await createServer();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("accounts")
    .insert({ ...values, user_id: user.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAccount(
  id: string,
  values: Partial<Omit<Account, "id" | "user_id" | "created_at">>,
) {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("accounts")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAccount(id: string) {
  const supabase = await createServer();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw error;
}
