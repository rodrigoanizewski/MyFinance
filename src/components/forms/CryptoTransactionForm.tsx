"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { CryptoWallet, CryptoTransaction } from "@/lib/services/crypto";

const TIPOS = [
  { value: "compra", label: "Compra" },
  { value: "venda", label: "Venda" },
  { value: "transferencia", label: "Transferência" },
  { value: "stake", label: "Stake" },
  { value: "unstake", label: "Unstake" },
  { value: "swap", label: "Swap" },
  { value: "airdrop", label: "Airdrop" },
  { value: "taxa", label: "Taxa" },
];

interface CryptoTransactionFormProps {
  tx?: CryptoTransaction | null;
  walletId: string;
  wallets: CryptoWallet[];
  onSuccess: () => void;
  onCancel: () => void;
}

async function recalcularHolding(
  supabase: ReturnType<typeof createClient>,
  walletId: string,
  simbolo: string,
) {
  const upperSimbolo = simbolo.toUpperCase().replace(/\s/g, "");

  const { data: txs } = await supabase
    .from("crypto_transactions")
    .select("*")
    .eq("wallet_id", walletId)
    .eq("simbolo", upperSimbolo)
    .order("data", { ascending: true });

  if (!txs || txs.length === 0) {
    await supabase
      .from("crypto_holdings")
      .delete()
      .eq("wallet_id", walletId)
      .eq("simbolo", upperSimbolo);
    return;
  }

  let quantidade = 0;
  let custoTotal = 0;

  for (const tx of txs) {
    const qty = tx.quantidade;
    const price = tx.preco_unitario ?? 0;
    const fee = tx.taxa ?? 0;

    switch (tx.tipo) {
      case "compra":
      case "unstake":
        custoTotal += qty * price + fee;
        quantidade += qty;
        break;
      case "venda":
      case "stake":
        if (quantidade > 0) {
          const proporcao = qty / quantidade;
          custoTotal -= custoTotal * proporcao;
        }
        quantidade -= qty;
        break;
      case "airdrop":
        quantidade += qty;
        break;
      case "taxa":
        break;
      case "transferencia":
      case "swap":
        break;
    }
  }

  const precoMedio = quantidade > 0 ? custoTotal / quantidade : 0;

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { data: existing } = await supabase
    .from("crypto_holdings")
    .select("id")
    .eq("wallet_id", walletId)
    .eq("user_id", user.user.id)
    .eq("simbolo", upperSimbolo)
    .maybeSingle();

  if (quantidade > 0) {
    if (existing) {
      await supabase
        .from("crypto_holdings")
        .update({ quantidade, preco_medio_brl: precoMedio })
        .eq("id", existing.id);
    } else {
      await supabase.from("crypto_holdings").insert({
        wallet_id: walletId,
        user_id: user.user.id,
        simbolo: upperSimbolo,
        quantidade,
        preco_medio_brl: precoMedio,
      });
    }
  } else {
    if (existing) {
      await supabase.from("crypto_holdings").delete().eq("id", existing.id);
    }
  }
}

export default function CryptoTransactionForm({
  tx,
  walletId,
  wallets,
  onSuccess,
  onCancel,
}: CryptoTransactionFormProps) {
  const [tipo, setTipo] = useState("compra");
  const [simbolo, setSimbolo] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [taxa, setTaxa] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 16));
  const [notas, setNotas] = useState("");
  const [targetWalletId, setTargetWalletId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (tx) {
      setTipo(tx.tipo);
      setSimbolo(tx.simbolo);
      setQuantidade(String(tx.quantidade));
      setPrecoUnitario(tx.preco_unitario ? String(tx.preco_unitario) : "");
      setTaxa(tx.taxa ? String(tx.taxa) : "");
      setData(tx.data ? new Date(tx.data).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
      setNotas(tx.notas ?? "");
    }
  }, [tx]);

  const showPrice = ["compra", "venda", "stake", "unstake", "swap"].includes(tipo);
  const showTarget = tipo === "transferencia";
  const symbolLabel = tipo === "swap" ? "De (símbolo)" : "Símbolo";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const qtyNum = parseFloat(quantidade.replace(",", "."));
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError("Quantidade inválida.");
      setSaving(false);
      return;
    }

    const precoNum = precoUnitario ? parseFloat(precoUnitario.replace(",", ".")) : 0;
    const taxaNum = taxa ? parseFloat(taxa.replace(",", ".")) : 0;
    const upperSimbolo = simbolo.toUpperCase().replace(/\s/g, "");

    if (!upperSimbolo && tipo !== "taxa") {
      setError("Informe o símbolo do ativo.");
      setSaving(false);
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      setError("Não autenticado.");
      setSaving(false);
      return;
    }

    // Insert transaction
    if (tx) {
      const { error: err } = await supabase
        .from("crypto_transactions")
        .update({
          tipo,
          simbolo: upperSimbolo,
          quantidade: qtyNum,
          preco_unitario: precoNum || null,
          taxa: taxaNum,
          data: new Date(data).toISOString(),
          notas: notas || null,
        })
        .eq("id", tx.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      // Insert this transaction
      const { error: err } = await supabase
        .from("crypto_transactions")
        .insert({
          wallet_id: walletId,
          user_id: user.user.id,
          tipo,
          simbolo: upperSimbolo,
          quantidade: qtyNum,
          preco_unitario: precoNum || null,
          taxa: taxaNum,
          data: new Date(data).toISOString(),
          notas: notas || null,
        });
      if (err) { setError(err.message); setSaving(false); return; }

      // If transfer, also add receiving transaction in target wallet
      if (tipo === "transferencia" && targetWalletId) {
        await supabase.from("crypto_transactions").insert({
          wallet_id: targetWalletId,
          user_id: user.user.id,
          tipo: "transferencia",
          simbolo: upperSimbolo,
          quantidade: qtyNum,
          preco_unitario: precoNum || null,
          taxa: 0,
          data: new Date(data).toISOString(),
          notas: `Recebido de transferência${notas ? `: ${notas}` : ""}`,
        });
      }
    }

    // Recalculate holdings for this wallet + symbol
    await recalcularHolding(supabase, walletId, upperSimbolo);

    // If swap, also handle the target symbol (user must enter "BTC/ETH" format)
    if (tipo === "swap" && upperSimbolo.includes("/")) {
      const [from, to] = upperSimbolo.split("/");
      if (to) {
        await recalcularHolding(supabase, walletId, to);
      }
    }

    // If transfer, also recalculate target wallet
    if (tipo === "transferencia" && targetWalletId) {
      await recalcularHolding(supabase, targetWalletId, upperSimbolo);
    }

    setSaving(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-4 gap-1.5">
        {TIPOS.filter((t) => ["compra", "venda", "transferencia", "stake", "unstake", "swap", "airdrop", "taxa"].includes(t.value)).map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTipo(t.value)}
            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              tipo === t.value
                ? "bg-violet-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tipo !== "taxa" && (
        <Input
          id="simbolo"
          label={symbolLabel}
          value={simbolo}
          onChange={(e) => setSimbolo(e.target.value)}
          required
          placeholder={tipo === "swap" ? "Ex: BTC/ETH" : "Ex: BTC"}
        />
      )}

      <Input
        id="quantidade"
        label="Quantidade"
        type="text"
        inputMode="decimal"
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
        required
        placeholder="0.00"
      />

      {showPrice && (
        <Input
          id="preco"
          label="Preço unitário (USD)"
          type="text"
          inputMode="decimal"
          value={precoUnitario}
          onChange={(e) => setPrecoUnitario(e.target.value)}
          placeholder="0.00"
        />
      )}

      <Input
        id="taxa_fee"
        label="Taxa (USD, opcional)"
        type="text"
        inputMode="decimal"
        value={taxa}
        onChange={(e) => setTaxa(e.target.value)}
        placeholder="0,00"
      />

      {showTarget && (
        <Select
          id="target_wallet"
          label="Carteira de destino"
          value={targetWalletId}
          onChange={(e) => setTargetWalletId(e.target.value)}
          options={wallets.filter((w) => w.id !== walletId).map((w) => ({ value: w.id, label: w.nome }))}
          placeholder="Selecionar carteira..."
        />
      )}

      <Input
        id="data"
        label="Data e hora"
        type="datetime-local"
        value={data}
        onChange={(e) => setData(e.target.value)}
        required
      />

      <Input
        id="notas"
        label="Notas (opcional)"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        placeholder="Detalhes da transação..."
      />

      {error && (
        <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-400">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : tx ? "Atualizar" : "Registrar"}
        </Button>
      </div>
    </form>
  );
}
