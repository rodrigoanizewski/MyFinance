"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Wallet, TrendingUp, Home, Car } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AccountForm from "@/components/forms/AccountForm";
import InvestmentForm from "@/components/forms/InvestmentForm";
import FixedAssetForm from "@/components/forms/FixedAssetForm";
import type { Account } from "@/lib/services/accounts";
import { formatCurrency } from "@/lib/utils/format";

const TIPO_LABELS: Record<string, string> = {
  corrente: "Conta Corrente", poupanca: "Poupança", corretora: "Corretora",
  carteira_cripto: "Carteira Cripto", exchange_cripto: "Exchange Cripto",
};

const INVEST_TIPO_LABELS: Record<string, string> = {
  renda_fixa: "Renda Fixa", acao: "Ação", fundo: "Fundo", fii: "FII",
};

const ASSET_CAT_LABELS: Record<string, string> = {
  imovel: "Imóvel", veiculo: "Veículo", outro: "Outro",
};

export default function PatrimonioPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<"account" | "investment" | "asset" | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    setLoading(true);
    const [aRes, iRes, faRes] = await Promise.all([
      supabase.from("accounts").select("*").order("created_at", { ascending: true }),
      supabase.from("investments").select("*, accounts(nome)").order("nome"),
      supabase.from("fixed_assets").select("*").order("nome"),
    ]);
    if (aRes.data) setAccounts(aRes.data);
    if (iRes.data) setInvestments(iRes.data);
    if (faRes.data) setAssets(faRes.data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { refresh(); }, [refresh]);

  const openModal = (type: "account" | "investment" | "asset", item?: any) => {
    setModalType(type); setEditingItem(item ?? null);
  };

  const handleDelete = async (table: string, id: string) => {
    if (!confirm(`Excluir este item?`)) return;
    await supabase.from(table).delete().eq("id", id);
    refresh();
  };

  const handleFormSuccess = () => { setModalType(null); setEditingItem(null); refresh(); };

  const totalInvestido = investments.reduce((sum: number, i: any) =>
    sum + (i.preco_atual ?? i.preco_medio) * i.quantidade, 0);
  const totalBens = assets.reduce((sum: number, a: any) => sum + (a.valor_estimado ?? 0), 0);

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">Patrimônio</h1>

      {/* Contas */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Contas</h2>
          <Button size="sm" onClick={() => openModal("account")}><Plus size={16} /> Nova conta</Button>
        </div>
        {accounts.length === 0 ? (
          <EmptyState title="Nenhuma conta" description="Adicione suas contas bancárias e corretoras." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((acc) => (
              <div key={acc.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400"><Wallet size={18} /></div>
                    <div>
                      <p className="text-sm font-medium text-white">{acc.nome}</p>
                      <p className="text-xs text-zinc-500">{TIPO_LABELS[acc.tipo] ?? acc.tipo}</p>
                      {acc.instituicao && <p className="text-xs text-zinc-600">{acc.instituicao}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal("account", acc)} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete("accounts", acc.id)} className="rounded-lg p-1 text-zinc-500 hover:bg-red-900/30 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${acc.liquida ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <span className="text-xs text-zinc-500">{acc.liquida ? "Líquida" : "Não líquida"} · {acc.moeda}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Investimentos */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Investimentos ({formatCurrency(totalInvestido)})
          </h2>
          <Button size="sm" onClick={() => openModal("investment")}><Plus size={16} /> Novo investimento</Button>
        </div>
        {investments.length === 0 ? (
          <EmptyState title="Nenhum investimento" description="Adicione renda fixa, ações, fundos ou FIIs." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Ativo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Qtd</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Preço Médio</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Preço Atual</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Valor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400"></th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv: any) => {
                  const preco = inv.preco_atual ?? inv.preco_medio;
                  const valor = inv.quantidade * preco;
                  return (
                    <tr key={inv.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{inv.nome}</p>
                        {inv.accounts?.nome && <p className="text-xs text-zinc-500">{inv.accounts.nome}</p>}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{INVEST_TIPO_LABELS[inv.tipo_ativo]}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{inv.quantidade}</td>
                      <td className="px-4 py-3 text-right text-zinc-400">{formatCurrency(inv.preco_medio)}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{formatCurrency(preco)}</td>
                      <td className="px-4 py-3 text-right font-medium text-white">{formatCurrency(valor)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openModal("investment", inv)} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete("investments", inv.id)} className="rounded-lg p-1 text-zinc-500 hover:bg-red-900/30 hover:text-red-400"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bens */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Bens ({formatCurrency(totalBens)})
          </h2>
          <Button size="sm" onClick={() => openModal("asset")}><Plus size={16} /> Novo bem</Button>
        </div>
        {assets.length === 0 ? (
          <EmptyState title="Nenhum bem cadastrado" description="Adicione imóveis, veículos e outros bens." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((a: any) => (
              <div key={a.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-900/30 text-amber-400">
                      {a.categoria === "imovel" ? <Home size={18} /> : a.categoria === "veiculo" ? <Car size={18} /> : <TrendingUp size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{a.nome}</p>
                      <p className="text-xs text-zinc-500">{ASSET_CAT_LABELS[a.categoria]}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal("asset", a)} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete("fixed_assets", a.id)} className="rounded-lg p-1 text-zinc-500 hover:bg-red-900/30 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {a.valor_estimado != null && (
                    <div className="flex justify-between text-xs"><span className="text-zinc-500">Estimado</span><span className="text-zinc-300">{formatCurrency(a.valor_estimado)}</span></div>
                  )}
                  {a.valor_compra != null && (
                    <div className="flex justify-between text-xs"><span className="text-zinc-500">Compra</span><span className="text-zinc-400">{formatCurrency(a.valor_compra)}</span></div>
                  )}
                  {a.data_compra && (
                    <div className="flex justify-between text-xs"><span className="text-zinc-500">Data</span><span className="text-zinc-500">{new Date(a.data_compra).toLocaleDateString("pt-BR")}</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal open={modalType === "account"} onClose={() => setModalType(null)} title={editingItem ? "Editar conta" : "Nova conta"}>
        <AccountForm account={editingItem} onSuccess={handleFormSuccess} onCancel={() => setModalType(null)} />
      </Modal>
      <Modal open={modalType === "investment"} onClose={() => setModalType(null)} title={editingItem ? "Editar investimento" : "Novo investimento"}>
        <InvestmentForm investment={editingItem} accounts={accounts} onSuccess={handleFormSuccess} onCancel={() => setModalType(null)} />
      </Modal>
      <Modal open={modalType === "asset"} onClose={() => setModalType(null)} title={editingItem ? "Editar bem" : "Novo bem"}>
        <FixedAssetForm asset={editingItem} onSuccess={handleFormSuccess} onCancel={() => setModalType(null)} />
      </Modal>
    </div>
  );
}
