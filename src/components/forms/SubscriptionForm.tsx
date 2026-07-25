"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { Tables } from "@/lib/types/database";

type Recurring = Tables<"recurring_transactions">;

interface SubscriptionFormProps {
  sub?: Recurring | null;
  accounts: { id: string; nome: string }[];
  categories: { id: string; nome: string; tipo: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SubscriptionForm({ sub, accounts, categories, onSuccess, onCancel }: SubscriptionFormProps) {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [diaVencimento, setDiaVencimento] = useState("1");
  const [frequencia, setFrequencia] = useState("mensal");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [proximaData, setProximaData] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (sub) {
      setNome(sub.nome);
      setValor(String(sub.valor));
      setDiaVencimento(String(sub.dia_vencimento));
      setFrequencia(sub.frequencia);
      setCategoryId(sub.category_id ?? "");
      setAccountId(sub.account_id ?? "");
      setAtivo(sub.ativo);
      setProximaData(sub.proxima_data ?? "");
    } else {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      setProximaData(nextMonth.toISOString().slice(0, 10));
    }
  }, [sub]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const val = parseFloat(valor.replace(",", "."));
    if (isNaN(val) || val <= 0) { setError("Valor inválido."); setSaving(false); return; }
    const dia = parseInt(diaVencimento);
    if (isNaN(dia) || dia < 1 || dia > 31) { setError("Dia de vencimento inválido."); setSaving(false); return; }

    const payload = {
      nome,
      valor: val,
      dia_vencimento: dia,
      frequencia,
      category_id: categoryId || null,
      account_id: accountId || null,
      ativo,
      proxima_data: proximaData || null,
      moeda: sub?.moeda ?? "BRL",
    };

    const { data: user } = await supabase.auth.getUser();

    if (sub) {
      const { error: err } = await supabase.from("recurring_transactions").update(payload).eq("id", sub.id);
      if (err) setError(err.message);
    } else {
      const { error: err } = await supabase.from("recurring_transactions").insert({ ...payload, user_id: user.user!.id });
      if (err) setError(err.message);
    }

    setSaving(false);
    if (!error) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="nome" label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Netflix, Aluguel, Plano de saúde..." />
      <div className="grid grid-cols-3 gap-3">
        <Input id="valor" label="Valor" value={valor} onChange={(e) => setValor(e.target.value)} required placeholder="0,00" />
        <Input id="dia" label="Dia vencimento" type="number" min="1" max="31" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} required />
        <Select
          id="freq"
          label="Frequência"
          value={frequencia}
          onChange={(e) => setFrequencia(e.target.value)}
          options={[{ value: "mensal", label: "Mensal" }, { value: "anual", label: "Anual" }]}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select
          id="cat"
          label="Categoria"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={categories.filter((c) => c.tipo === "despesa").map((c) => ({ value: c.id, label: c.nome }))}
          placeholder="Selecionar..."
        />
        <Select
          id="acc"
          label="Conta de pagamento"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          options={accounts.map((a) => ({ value: a.id, label: a.nome }))}
          placeholder="Selecionar..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input id="prox" label="Próxima data" type="date" value={proximaData} onChange={(e) => setProximaData(e.target.value)} />
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500" />
            Ativa
          </label>
        </div>
      </div>
      {error && <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : sub ? "Atualizar" : "Adicionar"}</Button>
      </div>
    </form>
  );
}
