"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { CryptoWallet } from "@/lib/services/crypto";

interface WalletFormProps {
  wallet?: CryptoWallet | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const TIPOS = [
  { value: "exchange", label: "Exchange (Binance, Coinbase...)" },
  { value: "wallet_propria", label: "Wallet Própria (MetaMask, Trust...)" },
  { value: "cold_wallet", label: "Cold Wallet (Ledger, Trezor...)" },
];

export default function WalletForm({ wallet, onSuccess, onCancel }: WalletFormProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("exchange");
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (wallet) {
      setNome(wallet.nome);
      setTipo(wallet.tipo);
      setObservacao(wallet.observacao ?? "");
    }
  }, [wallet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = { nome, tipo, observacao: observacao || null };

    if (wallet) {
      const { error: err } = await supabase
        .from("crypto_wallets")
        .update(payload)
        .eq("id", wallet.id);
      if (err) setError(err.message);
    } else {
      const { data: user } = await supabase.auth.getUser();
      const { error: err } = await supabase
        .from("crypto_wallets")
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
        placeholder="Ex: Binance, MetaMask, Ledger..."
      />
      <Select
        id="tipo"
        label="Tipo"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        options={TIPOS}
      />
      <Input
        id="observacao"
        label="Observação (opcional)"
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        placeholder="Ex: Carteira principal de trades"
      />
      {error && (
        <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-400">{error}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : wallet ? "Atualizar" : "Criar carteira"}
        </Button>
      </div>
    </form>
  );
}
