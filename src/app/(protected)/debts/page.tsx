"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, CreditCard, AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DebtForm from "@/components/forms/DebtForm";
import { formatCurrency } from "@/lib/utils/format";

const TIPO_LABELS: Record<string, string> = {
  emprestimo: "Empréstimo", cartao: "Cartão de Crédito", financiamento: "Financiamento",
};

export default function DebtsPage() {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("debts").select("*").order("vencimento");
    if (data) setDebts(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleEdit = (d: any) => { setEditing(d); setModalOpen(true); };
  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta dívida?")) return;
    await supabase.from("debts").delete().eq("id", id);
    refresh();
  };
  const handleFormSuccess = () => { setModalOpen(false); setEditing(null); refresh(); };

  const totalRestante = debts.reduce((s: number, d: any) => s + d.valor_restante, 0);
  const totalOriginal = debts.reduce((s: number, d: any) => s + d.valor_total, 0);
  const pctPago = totalOriginal > 0 ? ((totalOriginal - totalRestante) / totalOriginal) * 100 : 0;

  if (loading) return <LoadingSpinner className="py-20" />;

  const now = new Date();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dívidas</h1>
        <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Nova dívida</Button>
      </div>

      {debts.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card>
              <p className="text-xs text-zinc-400">Total Original</p>
              <p className="mt-1 text-lg font-bold text-white">{formatCurrency(totalOriginal)}</p>
            </Card>
            <Card>
              <p className="text-xs text-zinc-400">Saldo Devedor</p>
              <p className="mt-1 text-lg font-bold text-red-400">{formatCurrency(totalRestante)}</p>
            </Card>
            <Card>
              <p className="text-xs text-zinc-400">Total Pago</p>
              <p className="mt-1 text-lg font-bold text-emerald-400">{formatCurrency(totalOriginal - totalRestante)}</p>
            </Card>
            <Card>
              <p className="text-xs text-zinc-400">Quitado</p>
              <p className="mt-1 text-lg font-bold text-white">{pctPago.toFixed(0)}%</p>
            </Card>
          </div>

          <div className="h-3 w-full rounded-full bg-zinc-800">
            <div className="h-3 rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(pctPago, 100)}%` }} />
          </div>
        </>
      )}

      {debts.length === 0 ? (
        <EmptyState title="Nenhuma dívida" description="Adicione empréstimos, cartões e financiamentos." action={<Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Adicionar dívida</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {debts.map((d: any) => {
            const pctRestante = d.valor_total > 0 ? (d.valor_restante / d.valor_total) * 100 : 0;
            const isLate = d.vencimento && new Date(d.vencimento) < now;
            return (
              <div key={d.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-white">{d.nome}</p>
                    <p className="text-xs text-zinc-500">{TIPO_LABELS[d.tipo]}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(d)} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(d.id)} className="rounded-lg p-1 text-zinc-500 hover:bg-red-900/30 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Restante</span>
                    <span className="font-semibold text-red-400">{formatCurrency(d.valor_restante)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-800">
                    <div className="h-2 rounded-full bg-red-500" style={{ width: `${Math.min(pctRestante, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>de {formatCurrency(d.valor_total)}</span>
                    <span>{(100 - pctRestante).toFixed(0)}% pago</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {d.taxa_juros != null && (
                    <div><span className="text-zinc-500">Juros: </span><span className="text-zinc-400">{d.taxa_juros}% a.m.</span></div>
                  )}
                  {d.parcela_mensal != null && (
                    <div><span className="text-zinc-500">Parcela: </span><span className="text-zinc-400">{formatCurrency(d.parcela_mensal)}</span></div>
                  )}
                  {d.vencimento && (
                    <div className={`col-span-2 flex items-center gap-1 ${isLate ? "text-red-400" : "text-zinc-500"}`}>
                      {isLate && <AlertTriangle size={12} />}
                      Vencimento: {new Date(d.vencimento).toLocaleDateString("pt-BR")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? "Editar dívida" : "Nova dívida"}>
        <DebtForm debt={editing} onSuccess={handleFormSuccess} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
    </div>
  );
}
