"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Target } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import GoalForm from "@/components/forms/GoalForm";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("goals").select("*").order("prioridade", { ascending: true });
    if (data) setGoals(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleEdit = (g: any) => { setEditing(g); setModalOpen(true); };
  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este objetivo?")) return;
    await supabase.from("goals").delete().eq("id", id);
    refresh();
  };
  const handleFormSuccess = () => { setModalOpen(false); setEditing(null); refresh(); };

  if (loading) return <LoadingSpinner className="py-20" />;

  const now = new Date();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Objetivos</h1>
        <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Novo objetivo</Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState title="Nenhum objetivo" description="Defina metas financeiras para acompanhar seu progresso." action={<Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Criar objetivo</Button>} />
      ) : (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <p className="text-xs text-zinc-400">Total em metas</p>
              <p className="mt-1 text-lg font-bold text-white">{formatCurrency(goals.reduce((s: number, g: any) => s + g.valor_alvo, 0))}</p>
            </Card>
            <Card>
              <p className="text-xs text-zinc-400">Acumulado</p>
              <p className="mt-1 text-lg font-bold text-emerald-400">{formatCurrency(goals.reduce((s: number, g: any) => s + g.valor_atual, 0))}</p>
            </Card>
            <Card>
              <p className="text-xs text-zinc-400">Faltam</p>
              <p className="mt-1 text-lg font-bold text-amber-400">{formatCurrency(goals.reduce((s: number, g: any) => s + Math.max(0, g.valor_alvo - g.valor_atual), 0))}</p>
            </Card>
          </div>

          <div className="space-y-4">
            {goals.map((g: any) => {
              const pct = g.valor_alvo > 0 ? (g.valor_atual / g.valor_alvo) * 100 : 0;
              const gap = g.valor_alvo - g.valor_atual;
              const isUrgent = g.data_alvo && new Date(g.data_alvo) < new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
              const isOverdue = g.data_alvo && new Date(g.data_alvo) < now;

              return (
                <div key={g.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${g.prioridade >= 2 ? "bg-red-900/30 text-red-400" : "bg-blue-900/30 text-blue-400"}`}>
                        <Target size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{g.nome}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          {g.data_alvo && (
                            <span className={isOverdue ? "text-red-400" : isUrgent ? "text-amber-400" : ""}>
                              {isOverdue ? "Vencido: " : "Até "}{formatDate(g.data_alvo)}
                            </span>
                          )}
                          {g.prioridade > 0 && <span>· Prioridade {g.prioridade}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(g)} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(g.id)} className="rounded-lg p-1 text-zinc-500 hover:bg-red-900/30 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">{formatCurrency(g.valor_atual)}</span>
                      <span className="text-zinc-500">{formatCurrency(g.valor_alvo)}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-zinc-800">
                      <div
                        className={`h-3 rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className={pct >= 100 ? "text-emerald-400" : "text-zinc-500"}>
                      {pct >= 100 ? "Concluído!" : `${pct.toFixed(0)}% concluído`}
                    </span>
                    <span className="text-zinc-500">
                      {gap > 0 ? `Faltam ${formatCurrency(gap)}` : "Superado em " + formatCurrency(Math.abs(gap))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? "Editar objetivo" : "Novo objetivo"}>
        <GoalForm goal={editing} onSuccess={handleFormSuccess} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
    </div>
  );
}
