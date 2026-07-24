import { createServer } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type Goal = Tables<"goals">;

export async function getGoals() {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("prioridade", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createGoal(values: Omit<Goal, "id" | "user_id">) {
  const supabase = await createServer();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("goals")
    .insert({ ...values, user_id: user.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateGoal(id: string, values: Partial<Omit<Goal, "id" | "user_id">>) {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("goals")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGoal(id: string) {
  const supabase = await createServer();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}
