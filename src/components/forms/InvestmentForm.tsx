"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { Investment } from "@/lib/services/investments";
import type { Account } from "@/lib/services/accounts";

interface InvestmentFormProps {
  investment?: Investment | null;
  accounts: Account[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function InvestmentForm({ investment, accounts, onSuccess, onCancel }: InvestmentFormProps) {
  const [nome, setNome] = useState("");
  const [tipoAtivo, setTipoAtivo] = useState("renda_fixa");
  const [quantidade, setQuantidade] = useState("");
  const [precoMedio, setPrecoMedio] = useState("");
  const [precoAtual, setPrecoAtual] = useState("");
  const [accountId, setAccountId] = useState("");
  const [moeda, setMoeda] = useState("BRL");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (investment) {
      setNome(investment.nome);
      setTipoAtivo(investment.tipo_ativo);
      setQuantidade(String(investment.quantidade));
      setPrecoMedio(String(investment.preco_medio));
      setPrecoAtual(investment.preco_atual ? String(investment.preco_atual) : "");
      setAccountId(investment.account_id ?? "");
      setMoeda(investment.moeda ?? "BRL");
    }
  }, [investment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const qtd = parseFloat(quantidade.replace(",", "."));
    const pm = parseFloat(precoMedio.replace(",", "."));
    const pa = precoAtual ? parseFloat(precoAtual.replace(",", ".")) : null;

    if (isNaN(qtd) || isNaN(pm)) {
      setError("Quantidade e preço médio são obrigatórios.");
      setSaving(false);
      return;
    }

    const payload = {
      nome,
      tipo_ativo: tipoAtivo,
      quantidade: qtd,
      preco_medio: pm,
      preco_atual: pa ?? undefined,
      account_id: accountId || null,
      moeda,
    };

    const { data: user } = await supabase.auth.getUser();

    if (investment) {
      const { error: err } = await supabase.from("investments").update(payload).eq("id", investment.id);
      if (err) setError(err.message);
    } else {
      const { error: err } = await supabase.from("investments").insert({ ...payload, user_id: user.user!.id });
      if (err) setError(err.message);
    }

    setSaving(false);
    if (!error) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="nome" label="Nome do ativo" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Tesouro Selic 2027, PETR4..." />
      <Select
        id="tipo"
        label="Tipo"
        value={tipoAtivo}
        onChange={(e) => setTipoAtivo(e.target.value)}
        options={[
          { value: "renda_fixa", label: "Renda Fixa" },
          { value: "acao", label: "Ação" },
          { value: "fundo", label: "Fundo" },
          { value: "fii", label: "FII" },
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input id="qtd" label="Quantidade" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} required placeholder="0" />
        <Input id="pm" label="Preço médio" value={precoMedio} onChange={(e) => setPrecoMedio(e.target.value)} required placeholder="0,00" />
      </div>
      <Input id="pa" label="Preço atual (opcional)" value={precoAtual} onChange={(e) => setPrecoAtual(e.target.value)} placeholder="Deixe vazio se igual ao preço médio" />
      <Select
        id="account"
        label="Conta vinculada"
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        options={accounts.filter((a) => ["corretora", "corrente"].includes(a.tipo)).map((a) => ({ value: a.id, label: a.nome }))}
        placeholder="Selecionar conta..."
      />
      {error && <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : investment ? "Atualizar" : "Adicionar"}</Button>
      </div>
    </form>
  );
}
