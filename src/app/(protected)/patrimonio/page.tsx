"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Wallet, Landmark } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AccountForm from "@/components/forms/AccountForm";
import type { Account } from "@/lib/services/accounts";

const TIPO_LABELS: Record<string, string> = {
  corrente: "Conta Corrente",
  poupanca: "Poupança",
  corretora: "Corretora",
  carteira_cripto: "Carteira Cripto",
  exchange_cripto: "Exchange Cripto",
};

export default function PatrimonioPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setAccounts(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleEdit = (acc: Account) => {
    setEditingAccount(acc);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta conta? Transações vinculadas serão preservadas.")) return;
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (!error) refresh();
  };

  const handleFormSuccess = () => {
    setModalOpen(false);
    setEditingAccount(null);
    refresh();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Patrimônio</h1>
        <Button
          onClick={() => {
            setEditingAccount(null);
            setModalOpen(true);
          }}
          size="sm"
        >
          <Plus size={16} />
          Nova conta
        </Button>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Contas
        </h2>
        {loading ? (
          <LoadingSpinner className="py-8" />
        ) : accounts.length === 0 ? (
          <EmptyState
            title="Nenhuma conta cadastrada"
            description="Adicione contas corrente, poupança, corretoras e carteiras cripto."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setEditingAccount(null);
                  setModalOpen(true);
                }}
              >
                <Plus size={16} /> Adicionar conta
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                      <Wallet size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{acc.nome}</p>
                      <p className="text-xs text-zinc-500">
                        {TIPO_LABELS[acc.tipo] ?? acc.tipo}
                      </p>
                      {acc.instituicao && (
                        <p className="text-xs text-zinc-600">{acc.instituicao}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(acc)}
                      className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="rounded-lg p-1 text-zinc-500 hover:bg-red-900/30 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      acc.liquida ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  <span className="text-xs text-zinc-500">
                    {acc.liquida ? "Líquida" : "Não líquida"} · {acc.moeda}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Investimentos
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-sm text-zinc-500">
            Módulo de investimentos será implementado na Fase 4.
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Bens
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-sm text-zinc-500">
            Módulo de bens será implementado na Fase 4.
          </p>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAccount(null);
        }}
        title={editingAccount ? "Editar conta" : "Nova conta"}
      >
        <AccountForm
          account={editingAccount}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setModalOpen(false);
            setEditingAccount(null);
          }}
        />
      </Modal>
    </div>
  );
}
