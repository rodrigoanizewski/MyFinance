import { createServer } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type Category = Tables<"categories">;

export async function getCategories() {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getCategoriesByTipo(tipo: "receita" | "despesa") {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("tipo", tipo)
    .order("nome", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createCategory(
  values: Omit<Category, "id" | "user_id">,
) {
  const supabase = await createServer();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("categories")
    .insert({ ...values, user_id: user.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(
  id: string,
  values: Partial<Omit<Category, "id" | "user_id">>,
) {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("categories")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  const supabase = await createServer();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
