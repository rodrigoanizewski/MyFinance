import { createServer } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type FixedAsset = Tables<"fixed_assets">;

export async function getFixedAssets() {
  const supabase = await createServer();
  const { data, error } = await supabase.from("fixed_assets").select("*").order("nome");
  if (error) throw error;
  return data;
}

export async function createFixedAsset(values: Omit<FixedAsset, "id" | "user_id">) {
  const supabase = await createServer();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("fixed_assets")
    .insert({ ...values, user_id: user.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFixedAsset(id: string, values: Partial<Omit<FixedAsset, "id" | "user_id">>) {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("fixed_assets")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFixedAsset(id: string) {
  const supabase = await createServer();
  const { error } = await supabase.from("fixed_assets").delete().eq("id", id);
  if (error) throw error;
}
