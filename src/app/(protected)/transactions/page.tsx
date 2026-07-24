"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Filter } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TransactionForm from "@/components/forms/TransactionForm";
import type { Transaction } from "@/lib/services/transactions";
import type { Account } from "@/lib/services/accounts";
import type { Category } from "@/lib/services/categories";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>(
    new Date().toISOString().slice(0, 7),
  );

  const supabase = createClient();

  const refreshData = useCallback(async () => {
    setLoading(true);

    const [accRes, catRes] = await Promise.all([
      supabase.from("accounts").select("*").order("nome"),
      supabase.from("categories").select("*").order("nome"),
    ]);
    if (accRes.data) setAccounts(accRes.data);
    if (catRes.data) setCategories(catRes.data);

    let query = supabase
      .from("transactions")
      .select("*, categories(nome, cor, icone), accounts(nome)")
      .order("data", { ascending: false });

    if (tipoFilter !== "all") {
      query = query.eq("tipo", tipoFilter);
    }

    if (monthFilter) {
      const start = `${monthFilter}-01`;
      const [year, month] = monthFilter.split("-");
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const end = `${monthFilter}-${String(lastDay).padStart(2, "0")}`;
      query = query.gte("data", start).lte("data", end);
    }

    const { data: txData } = await query;
    if (txData) setTransactions(txData);
    setLoading(false);
  }, [supabase, tipoFilter, monthFilter]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta transação?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) refreshData();
  };

  const handleFormSuccess = () => {
    setModalOpen(false);
    setEditingTx(null);
    refreshData();
  };

  const receitasTotal = transactions
    .filter((t) => t.tipo === "receita")
    .reduce((s, t) => s + t.valor, 0);

  const despesasTotal = transactions
    .filter((t) => t.tipo === "despesa")
    .reduce((s, t) => s + t.valor, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Transações</h1>
        <Button
          onClick={() => {
            setEditingTx(null);
            setModalOpen(true);
          }}
          size="sm"
        >
          <Plus size={16} />
          Nova
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
        />
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
          {[
            { value: "all", label: "Todas" },
            { value: "receita", label: "Receitas" },
            { value: "despesa", label: "Despesas" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setTipoFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                tipoFilter === f.value
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-400">Receitas</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">
            {formatCurrency(receitasTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-400">Despesas</p>
          <p className="mt-1 text-lg font-bold text-red-400">
            {formatCurrency(despesasTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-400">Saldo</p>
          <p
            className={`mt-1 text-lg font-bold ${
              receitasTotal - despesasTotal >= 0
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {formatCurrency(receitasTotal - despesasTotal)}
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="Nenhuma transação encontrada"
          description="Adicione sua primeira transação para começar."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditingTx(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} /> Nova transação
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {transactions.map((tx: any) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: tx.categories?.cor ?? "#6b7280",
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {tx.descricao}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {tx.categories?.nome && (
                      <span className="text-xs text-zinc-500">
                        {tx.categories.nome}
                      </span>
                    )}
                    {tx.accounts?.nome && (
                      <span className="text-xs text-zinc-600">
                        · {tx.accounts.nome}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      tx.tipo === "receita"
                        ? "text-emerald-400"
                        : tx.tipo === "transferencia"
                          ? "text-blue-400"
                          : "text-red-400"
                    }`}
                  >
                    {tx.tipo === "receita" ? "+" : tx.tipo === "transferencia" ? "↔" : "-"}{" "}
                    {formatCurrency(tx.valor)}
                  </p>
                  <p className="text-xs text-zinc-500">{formatDate(tx.data)}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(tx)}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-900/30 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTx(null);
        }}
        title={editingTx ? "Editar transação" : "Nova transação"}
      >
        <TransactionForm
          transaction={editingTx}
          accounts={accounts}
          categories={categories}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setModalOpen(false);
            setEditingTx(null);
          }}
        />
      </Modal>
    </div>
  );
}
