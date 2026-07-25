"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, CalendarSync, AlertTriangle, CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SubscriptionForm from "@/components/forms/SubscriptionForm";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    setLoading(true);
    const [sRes, aRes, cRes] = await Promise.all([
      supabase.from("recurring_transactions").select("*, categories(nome, cor), accounts(nome)").order("dia_vencimento"),
      supabase.from("accounts").select("id, nome").order("nome"),
      supabase.from("categories").select("id, nome, tipo").eq("tipo", "despesa").order("nome"),
    ]);
    if (sRes.data) setSubs(sRes.data);
    if (aRes.data) setAccounts(aRes.data);
    if (cRes.data) setCategories(cRes.data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleEdit = (s: any) => { setEditing(s); setModalOpen(true); };
  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta assinatura?")) return;
    await supabase.from("recurring_transactions").delete().eq("id", id);
    refresh();
  };
  const handleToggle = async (id: string, current: boolean) => {
    await supabase.from("recurring_transactions").update({ ativo: !current }).eq("id", id);
    refresh();
  };
  const handleFormSuccess = () => { setModalOpen(false); setEditing(null); refresh(); };

  const now = new Date();
  const totalAtivas = subs.filter((s) => s.ativo).reduce((sum: number, s: any) => sum + s.valor, 0);

  const proximas = subs
    .filter((s) => s.ativo && s.proxima_data)
    .sort((a, b) => new Date(a.proxima_data).getTime() - new Date(b.proxima_data).getTime());

  // Group by status
  const overdue = subs.filter((s) => s.ativo && s.proxima_data && new Date(s.proxima_data) < now);
  const thisWeek = subs.filter((s) => {
    if (!s.ativo || !s.proxima_data) return false;
    const d = new Date(s.proxima_data);
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
  });
  const upcoming = subs.filter((s) => {
    if (!s.ativo || !s.proxima_data) return false;
    const d = new Date(s.proxima_data);
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 7 && diff <= 30;
  });
  const rest = subs.filter((s) => {
    if (!s.ativo || !s.proxima_data) return true;
    const d = new Date(s.proxima_data);
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 30 || !s.ativo;
  });

  const alertCount = overdue.length + thisWeek.length;

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white">Assinaturas</h1>
          {alertCount > 0 && (
            <Badge variant="danger">{alertCount} {alertCount === 1 ? "alerta" : "alertas"}</Badge>
          )}
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Nova assinatura</Button>
      </div>

      {subs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <p className="text-xs text-zinc-400">Total mensal (ativas)</p>
            <p className="mt-1 text-lg font-bold text-white">{formatCurrency(totalAtivas)}</p>
          </Card>
          <Card>
            <p className="text-xs text-zinc-400">Total assinaturas</p>
            <p className="mt-1 text-lg font-bold text-white">{subs.length}</p>
          </Card>
          <Card>
            <p className="text-xs text-zinc-400">Ativas</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">{subs.filter((s) => s.ativo).length}</p>
          </Card>
          <Card>
            <p className="text-xs text-zinc-400">Inativas</p>
            <p className="mt-1 text-lg font-bold text-zinc-500">{subs.filter((s) => !s.ativo).length}</p>
          </Card>
        </div>
      )}

      {subs.length === 0 ? (
        <EmptyState title="Nenhuma assinatura" description="Cadastre faturas recorrentes como streaming, aluguel, planos..." action={<Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Adicionar</Button>} />
      ) : (
        <div className="space-y-6">
          {/* Overdue */}
          {overdue.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-red-400">
                <AlertTriangle size={14} /> Atrasadas ({overdue.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {overdue.map((s) => <SubCard key={s.id} sub={s} handleEdit={handleEdit} handleDelete={handleDelete} handleToggle={handleToggle} variant="danger" />)}
              </div>
            </div>
          )}

          {/* This week */}
          {thisWeek.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-400">
                Próximos 7 dias ({thisWeek.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {thisWeek.map((s) => <SubCard key={s.id} sub={s} handleEdit={handleEdit} handleDelete={handleDelete} handleToggle={handleToggle} variant="warning" />)}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-400">
                Este mês ({upcoming.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((s) => <SubCard key={s.id} sub={s} handleEdit={handleEdit} handleDelete={handleDelete} handleToggle={handleToggle} variant="info" />)}
              </div>
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Demais ({rest.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((s) => <SubCard key={s.id} sub={s} handleEdit={handleEdit} handleDelete={handleDelete} handleToggle={handleToggle} variant="default" />)}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? "Editar assinatura" : "Nova assinatura"}>
        <SubscriptionForm sub={editing} accounts={accounts} categories={categories} onSuccess={handleFormSuccess} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
    </div>
  );
}

function SubCard({ sub, handleEdit, handleDelete, handleToggle, variant }: any) {
  const now = new Date();
  const isOverdue = sub.proxima_data && new Date(sub.proxima_data) < now;
  const isSoon = sub.proxima_data && !isOverdue && Math.ceil((new Date(sub.proxima_data).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 7;

  return (
    <div className={`rounded-xl border bg-zinc-900 p-4 hover:border-zinc-600 transition-colors ${
      variant === "danger" ? "border-red-800/50" : variant === "warning" ? "border-amber-800/50" : "border-zinc-800"
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white truncate">{sub.nome}</p>
            {!sub.ativo && <Badge variant="default">Inativa</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {sub.categories?.nome && (
              <span className="text-xs text-zinc-500">{sub.categories.nome}</span>
            )}
            {sub.accounts?.nome && (
              <span className="text-xs text-zinc-600">· {sub.accounts.nome}</span>
            )}
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <button onClick={() => handleToggle(sub.id, sub.ativo)} className={`rounded-lg p-1 transition-colors ${sub.ativo ? "text-emerald-500 hover:bg-emerald-900/20" : "text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400"}`} title={sub.ativo ? "Desativar" : "Ativar"}>
            <CheckCircle2 size={14} />
          </button>
          <button onClick={() => handleEdit(sub)} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"><Pencil size={14} /></button>
          <button onClick={() => handleDelete(sub.id)} className="rounded-lg p-1 text-zinc-500 hover:bg-red-900/30 hover:text-red-400"><Trash2 size={14} /></button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-white">{formatCurrency(sub.valor)}</span>
        <span className="text-xs text-zinc-500">
          {sub.frequencia === "mensal" ? "/mês" : "/ano"}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-zinc-500">Dia {sub.dia_vencimento}</span>
        {sub.proxima_data && (
          <span className={`text-xs font-medium ${variant === "danger" ? "text-red-400" : variant === "warning" ? "text-amber-400" : "text-zinc-500"}`}>
            {isOverdue ? "Venceu " : "Próx: "}{formatDate(sub.proxima_data)}
          </span>
        )}
      </div>
    </div>
  );
}
