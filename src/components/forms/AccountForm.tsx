"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { Account } from "@/lib/services/accounts";

interface AccountFormProps {
  account?: Account | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const TIPOS = [
  { value: "corrente", label: "Conta Corrente" },
  { value: "poupanca", label: "Poupança" },
  { value: "corretora", label: "Corretora" },
  { value: "carteira_cripto", label: "Carteira Cripto" },
  { value: "exchange_cripto", label: "Exchange Cripto" },
];

export default function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("corrente");
  const [instituicao, setInstituicao] = useState("");
  const [moeda, setMoeda] = useState("BRL");
  const [liquida, setLiquida] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (account) {
      setNome(account.nome);
      setTipo(account.tipo);
      setInstituicao(account.instituicao ?? "");
      setMoeda(account.moeda ?? "BRL");
      setLiquida(account.liquida ?? true);
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = { nome, tipo, instituicao: instituicao || null, moeda, liquida };

    if (account) {
      const { error: err } = await supabase
        .from("accounts")
        .update(payload)
        .eq("id", account.id);
      if (err) setError(err.message);
    } else {
      const { data: user } = await supabase.auth.getUser();
      const { error: err } = await supabase
        .from("accounts")
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
        placeholder="Ex: Itaú, Nubank, Binance..."
      />
      <Select
        id="tipo"
        label="Tipo"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        options={TIPOS}
      />
      <Input
        id="instituicao"
        label="Instituição"
        value={instituicao}
        onChange={(e) => setInstituicao(e.target.value)}
        placeholder="Opcional"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="moeda"
          label="Moeda"
          value={moeda}
          onChange={(e) => setMoeda(e.target.value)}
          placeholder="BRL"
        />
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={liquida}
              onChange={(e) => setLiquida(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            Conta líquida
          </label>
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
          {saving ? "Salvando..." : account ? "Atualizar" : "Criar conta"}
        </Button>
      </div>
    </form>
  );
}
