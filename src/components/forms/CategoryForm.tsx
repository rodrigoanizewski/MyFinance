"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { Category } from "@/lib/services/categories";

const CORES = [
  { value: "#10b981", label: "Verde" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#f59e0b", label: "Âmbar" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#06b6d4", label: "Ciano" },
  { value: "#6b7280", label: "Cinza" },
];

interface CategoryFormProps {
  category?: Category | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"receita" | "despesa">("despesa");
  const [cor, setCor] = useState("#10b981");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (category) {
      setNome(category.nome);
      setTipo(category.tipo);
      setCor(category.cor ?? "#10b981");
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = { nome, tipo, cor };

    if (category) {
      const { error: err } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", category.id);
      if (err) setError(err.message);
    } else {
      const { data: user } = await supabase.auth.getUser();
      const { error: err } = await supabase
        .from("categories")
        .insert({ ...payload, user_id: user.user!.id });
      if (err) setError(err.message);
    }

    setSaving(false);
    if (!error) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="nome"
        label="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        required
        placeholder="Ex: Alimentação, Salário..."
      />
      <Select
        id="tipo"
        label="Tipo"
        value={tipo}
        onChange={(e) => setTipo(e.target.value as "receita" | "despesa")}
        options={[
          { value: "receita", label: "Receita" },
          { value: "despesa", label: "Despesa" },
        ]}
      />
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">Cor</label>
        <div className="flex flex-wrap gap-2">
          {CORES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCor(c.value)}
              className={`h-7 w-7 rounded-full border-2 transition-all ${
                cor === c.value ? "border-white scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
      </div>
      {error && (
        <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-400">{error}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : category ? "Atualizar" : "Criar categoria"}
        </Button>
      </div>
    </form>
  );
}
