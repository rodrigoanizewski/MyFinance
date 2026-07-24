"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { Transaction } from "@/lib/services/transactions";
import type { Account } from "@/lib/services/accounts";
import type { Category } from "@/lib/services/categories";
import { formatDate } from "@/lib/utils/format";

interface TransactionFormProps {
  transaction?: Transaction | null;
  accounts: Account[];
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TransactionForm({
  transaction,
  accounts,
  categories,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const [tipo, setTipo] = useState<"receita" | "despesa" | "transferencia">("despesa");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const filteredCategories = categories.filter((c) => c.tipo === tipo);

  useEffect(() => {
    if (transaction) {
      setTipo(transaction.tipo);
      setValor(String(transaction.valor));
      setDescricao(transaction.descricao ?? "");
      setData(transaction.data);
      setAccountId(transaction.account_id ?? "");
      setCategoryId(transaction.category_id ?? "");
      setTags(transaction.tags?.join(", ") ?? "");
    }
  }, [transaction]);

  useEffect(() => {
    setCategoryId("");
  }, [tipo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const parsedValor = parseFloat(valor.replace(",", "."));
    if (isNaN(parsedValor) || parsedValor <= 0) {
      setError("Informe um valor válido.");
      setSaving(false);
      return;
    }

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      tipo,
      valor: parsedValor,
      descricao: descricao || null,
      data,
      account_id: accountId || null,
      category_id: categoryId || null,
      tags: parsedTags.length > 0 ? parsedTags : null,
      moeda: transaction?.moeda ?? "BRL",
    };

    if (transaction) {
      const { error: err } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", transaction.id);
      if (err) setError(err.message);
    } else {
      const { data: user } = await supabase.auth.getUser();
      const { error: err } = await supabase
        .from("transactions")
        .insert({ ...payload as any, user_id: user.user!.id });
      if (err) setError(err.message);
    }

    setSaving(false);
    if (!error) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        {(["receita", "despesa", "transferencia"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tipo === t
                ? t === "receita"
                  ? "bg-emerald-600 text-white"
                  : t === "despesa"
                    ? "bg-red-600 text-white"
                    : "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {t === "receita" ? "Receita" : t === "despesa" ? "Despesa" : "Transferência"}
          </button>
        ))}
      </div>

      <Input
        id="valor"
        label="Valor"
        type="text"
        inputMode="decimal"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        required
        placeholder="0,00"
      />

      <Input
        id="descricao"
        label="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        required
        placeholder="Ex: Supermercado, Salário..."
      />

      <Input
        id="data"
        label="Data"
        type="date"
        value={data}
        onChange={(e) => setData(e.target.value)}
        required
      />

      <Select
        id="account"
        label="Conta"
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        options={accounts.map((a) => ({ value: a.id, label: a.nome }))}
        placeholder="Selecionar conta..."
      />

      <Select
        id="category"
        label="Categoria"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={filteredCategories.map((c) => ({ value: c.id, label: c.nome }))}
        placeholder="Selecionar categoria..."
      />

      <Input
        id="tags"
        label="Tags (separadas por vírgula)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Ex: mercado, mensal"
      />

      {error && (
        <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-400">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : transaction ? "Atualizar" : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}
