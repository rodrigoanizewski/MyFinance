"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Goal } from "@/lib/services/goals";

interface GoalFormProps {
  goal?: Goal | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GoalForm({ goal, onSuccess, onCancel }: GoalFormProps) {
  const [nome, setNome] = useState("");
  const [valorAlvo, setValorAlvo] = useState("");
  const [valorAtual, setValorAtual] = useState("");
  const [dataAlvo, setDataAlvo] = useState("");
  const [prioridade, setPrioridade] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (goal) {
      setNome(goal.nome);
      setValorAlvo(String(goal.valor_alvo));
      setValorAtual(String(goal.valor_atual));
      setDataAlvo(goal.data_alvo ?? "");
      setPrioridade(String(goal.prioridade ?? 0));
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const va = parseFloat(valorAlvo.replace(",", "."));
    const vat = parseFloat((valorAtual || "0").replace(",", "."));

    if (isNaN(va) || va <= 0) {
      setError("Informe um valor alvo válido.");
      setSaving(false);
      return;
    }

    const payload = {
      nome,
      valor_alvo: va,
      valor_atual: isNaN(vat) ? 0 : vat,
      data_alvo: dataAlvo || null,
      prioridade: parseInt(prioridade) || 0,
    };

    const { data: user } = await supabase.auth.getUser();

    if (goal) {
      const { error: err } = await supabase.from("goals").update(payload).eq("id", goal.id);
      if (err) setError(err.message);
    } else {
      const { error: err } = await supabase.from("goals").insert({ ...payload, user_id: user.user!.id });
      if (err) setError(err.message);
    }

    setSaving(false);
    if (!error) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="nome" label="Nome do objetivo" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Reserva de emergência" />
      <div className="grid grid-cols-2 gap-3">
        <Input id="valvo" label="Valor alvo (R$)" value={valorAlvo} onChange={(e) => setValorAlvo(e.target.value)} required placeholder="0,00" />
        <Input id="vatual" label="Valor atual (R$)" value={valorAtual} onChange={(e) => setValorAtual(e.target.value)} placeholder="0,00" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input id="dalvo" label="Data alvo" type="date" value={dataAlvo} onChange={(e) => setDataAlvo(e.target.value)} />
        <Input id="prio" label="Prioridade (0=baixa, 3=alta)" type="number" min="0" max="3" value={prioridade} onChange={(e) => setPrioridade(e.target.value)} />
      </div>
      {error && <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : goal ? "Atualizar" : "Adicionar"}</Button>
      </div>
    </form>
  );
}
