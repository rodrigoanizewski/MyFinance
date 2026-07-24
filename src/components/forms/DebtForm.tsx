"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { Debt } from "@/lib/services/debts";

interface DebtFormProps {
  debt?: Debt | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DebtForm({ debt, onSuccess, onCancel }: DebtFormProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("emprestimo");
  const [valorTotal, setValorTotal] = useState("");
  const [valorRestante, setValorRestante] = useState("");
  const [taxaJuros, setTaxaJuros] = useState("");
  const [parcelaMensal, setParcelaMensal] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (debt) {
      setNome(debt.nome);
      setTipo(debt.tipo);
      setValorTotal(String(debt.valor_total));
      setValorRestante(String(debt.valor_restante));
      setTaxaJuros(debt.taxa_juros != null ? String(debt.taxa_juros) : "");
      setParcelaMensal(debt.parcela_mensal != null ? String(debt.parcela_mensal) : "");
      setVencimento(debt.vencimento ?? "");
    } else {
      setValorRestante(valorTotal);
    }
  }, [debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const vt = parseFloat(valorTotal.replace(",", "."));
    const vr = parseFloat(valorRestante.replace(",", "."));
    if (isNaN(vt) || isNaN(vr)) {
      setError("Valores inválidos.");
      setSaving(false);
      return;
    }

    const payload = {
      nome,
      tipo,
      valor_total: vt,
      valor_restante: vr,
      taxa_juros: taxaJuros ? parseFloat(taxaJuros.replace(",", ".")) : null,
      parcela_mensal: parcelaMensal ? parseFloat(parcelaMensal.replace(",", ".")) : null,
      vencimento: vencimento || null,
    };

    const { data: user } = await supabase.auth.getUser();

    if (debt) {
      const { error: err } = await supabase.from("debts").update(payload).eq("id", debt.id);
      if (err) setError(err.message);
    } else {
      const { error: err } = await supabase.from("debts").insert({ ...payload, user_id: user.user!.id });
      if (err) setError(err.message);
    }

    setSaving(false);
    if (!error) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="nome" label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Financiamento Imobiliário" />
      <Select
        id="tipo"
        label="Tipo"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        options={[
          { value: "emprestimo", label: "Empréstimo" },
          { value: "cartao", label: "Cartão de Crédito" },
          { value: "financiamento", label: "Financiamento" },
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input id="vt" label="Valor total" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} required placeholder="0,00" />
        <Input id="vr" label="Valor restante" value={valorRestante} onChange={(e) => setValorRestante(e.target.value)} required placeholder="0,00" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input id="juros" label="Taxa de juros % a.m. (opcional)" value={taxaJuros} onChange={(e) => setTaxaJuros(e.target.value)} placeholder="0" />
        <Input id="parcela" label="Parcela mensal (opcional)" value={parcelaMensal} onChange={(e) => setParcelaMensal(e.target.value)} placeholder="0,00" />
      </div>
      <Input id="venc" label="Vencimento" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
      {error && <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : debt ? "Atualizar" : "Adicionar"}</Button>
      </div>
    </form>
  );
}
