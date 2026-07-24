"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import WalletForm from "@/components/forms/WalletForm";
import CryptoCompositionChart from "./CryptoCompositionChart";
import CryptoEvolutionChart from "./CryptoEvolutionChart";
import type { CryptoWallet, CryptoHolding } from "@/lib/services/crypto";
import { formatCurrency, formatCrypto } from "@/lib/utils/format";

const TIPO_LABELS: Record<string, string> = {
  exchange: "Exchange",
  wallet_propria: "Wallet",
  cold_wallet: "Cold Wallet",
};

function PriceLastUpdate({ priceCache }: { priceCache: Record<string, any> }) {
  const entries = Object.values(priceCache);
  if (entries.length === 0) return <span className="text-xs text-amber-400">Preços não sincronizados</span>;
  const lastUpdate = entries
    .map((p: any) => p.atualizado_em ? new Date(p.atualizado_em).getTime() : 0)
    .reduce((max: number, t: number) => Math.max(max, t), 0);
  const minutesAgo = lastUpdate > 0 ? Math.round((Date.now() - lastUpdate) / 60000) : null;
  if (minutesAgo === null) return <span className="text-xs text-amber-400">Preços desatualizados</span>;
  return (
    <span className="text-xs text-zinc-500">
      Atualizado {minutesAgo === 0 ? "agora" : `há ${minutesAgo}min`}
    </span>
  );
}

export default function CryptoPage() {
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [priceCache, setPriceCache] = useState<Record<string, { preco_usd: number; preco_brl: number }>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<CryptoWallet | null>(null);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    setLoading(true);
    const [wRes, hRes, pRes] = await Promise.all([
      supabase.from("crypto_wallets").select("*").order("nome"),
      supabase.from("crypto_holdings").select("*, crypto_wallets(nome)").order("simbolo"),
      supabase.from("price_cache").select("*"),
    ]);
    if (wRes.data) setWallets(wRes.data);
    if (hRes.data) setHoldings(hRes.data);
    if (pRes.data) {
      const cache: Record<string, { preco_usd: number; preco_brl: number; atualizado_em?: string }> = {};
      pRes.data.forEach((p) => { cache[p.simbolo] = { preco_usd: p.preco_usd ?? 0, preco_brl: p.preco_brl ?? 0, atualizado_em: p.atualizado_em }; });
      setPriceCache(cache);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleEdit = (w: CryptoWallet) => { setEditingWallet(w); setModalOpen(true); };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta carteira? Todas as transações e posições serão removidas.")) return;
    await supabase.from("crypto_wallets").delete().eq("id", id);
    refresh();
  };

  const handleFormSuccess = () => { setModalOpen(false); setEditingWallet(null); refresh(); };

  // Calculate totals
  const totalInvestido = holdings.reduce((sum: number, h: any) => {
    return sum + h.quantidade * (h.preco_medio_brl ?? 0);
  }, 0);

  const totalAtual = holdings.reduce((sum: number, h: any) => {
    const preco = priceCache[h.simbolo]?.preco_brl ?? h.preco_atual_brl ?? h.preco_medio_brl ?? 0;
    return sum + h.quantidade * preco;
  }, 0);

  const plTotal = totalAtual - totalInvestido;
  const plPct = totalInvestido > 0 ? (plTotal / totalInvestido) * 100 : 0;

  // Group holdings by symbol for composition chart
  const holdingsBySymbol: Record<string, { quantidade: number; valor: number; symbol: string }> = {};
  holdings.forEach((h: any) => {
    const preco = priceCache[h.simbolo]?.preco_brl ?? h.preco_medio_brl ?? 0;
    const key = h.simbolo;
    if (!holdingsBySymbol[key]) holdingsBySymbol[key] = { quantidade: 0, valor: 0, symbol: key };
    holdingsBySymbol[key].quantidade += h.quantidade;
    holdingsBySymbol[key].valor += h.quantidade * preco;
  });

  // Wallet totals
  const walletTotals: Record<string, number> = {};
  holdings.forEach((h: any) => {
    const preco = priceCache[h.simbolo]?.preco_brl ?? h.preco_medio_brl ?? 0;
    walletTotals[h.wallet_id] = (walletTotals[h.wallet_id] ?? 0) + h.quantidade * preco;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Cripto</h1>
        <div className="flex items-center gap-2">
          <PriceLastUpdate priceCache={priceCache} />
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await fetch("/api/update-prices");
              refresh();
            }}
          >
            <RefreshCw size={14} />
            Sincronizar
          </Button>
          <Button onClick={() => { setEditingWallet(null); setModalOpen(true); }} size="sm">
            <Plus size={16} /> Nova carteira
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 border-l-4 border-l-violet-500">
          <p className="text-xs text-zinc-400">Valor Atual</p>
          <p className="mt-1 text-lg font-bold text-white">{formatCurrency(totalAtual)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 border-l-4 border-l-blue-500">
          <p className="text-xs text-zinc-400">Total Investido</p>
          <p className="mt-1 text-lg font-bold text-white">{formatCurrency(totalInvestido)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs text-zinc-400">Lucro/Prejuízo</p>
          <p className={`mt-1 text-lg font-bold ${plTotal >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatCurrency(plTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 border-l-4 border-l-amber-500">
          <p className="text-xs text-zinc-400">Rentabilidade</p>
          <p className={`mt-1 text-lg font-bold ${plPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {plPct >= 0 ? "+" : ""}{plPct.toFixed(2)}%
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : wallets.length === 0 ? (
        <EmptyState
          title="Nenhuma carteira cripto"
          description="Adicione suas carteiras e exchanges para começar a registrar transações."
          action={<Button size="sm" onClick={() => { setEditingWallet(null); setModalOpen(true); }}><Plus size={16} /> Adicionar carteira</Button>}
        />
      ) : (
        <>
          {/* Wallets grid */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Carteiras</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {wallets.map((w) => (
                <Link
                  key={w.id}
                  href={`/crypto/${w.id}`}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-900/30 text-violet-400">
                        <Wallet size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-violet-400 transition-colors">
                          {w.nome}
                        </p>
                        <p className="text-xs text-zinc-500">{TIPO_LABELS[w.tipo] ?? w.tipo}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.preventDefault(); handleEdit(w); }}
                        className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); handleDelete(w.id); }}
                        className="rounded-lg p-1 text-zinc-500 hover:bg-red-900/30 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Valor estimado</span>
                    <span className="text-sm font-semibold text-white">
                      {formatCurrency(walletTotals[w.id] ?? 0)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-zinc-500 group-hover:text-violet-400 transition-colors">
                    Ver detalhes <ExternalLink size={10} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Charts */}
          {holdings.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <h2 className="mb-4 text-sm font-semibold text-zinc-300">Alocação por Moeda</h2>
                <CryptoCompositionChart
                  data={Object.values(holdingsBySymbol).map((h) => ({
                    name: h.symbol,
                    value: h.valor,
                  }))}
                />
              </Card>
              <Card>
                <h2 className="mb-4 text-sm font-semibold text-zinc-300">Evolução da Carteira (BTC)</h2>
                <CryptoEvolutionChart symbol="BTC" />
              </Card>
            </div>
          )}

          {/* Holdings table */}
          {holdings.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Posições</h2>
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Ativo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Carteira</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Quantidade</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Preço Médio</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Preço Atual</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Valor</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.filter((h: any) => h.quantidade > 0).map((h: any) => {
                      const precoAtual = priceCache[h.simbolo]?.preco_brl ?? h.preco_medio_brl ?? 0;
                      const valor = h.quantidade * precoAtual;
                      const custo = h.quantidade * (h.preco_medio_brl ?? 0);
                      const pl = valor - custo;
                      const plPctItem = custo > 0 ? (pl / custo) * 100 : 0;
                      return (
                        <tr key={h.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                          <td className="px-4 py-3">
                            <span className="font-medium text-white">{h.simbolo}</span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{h.crypto_wallets?.nome}</td>
                          <td className="px-4 py-3 text-right text-zinc-300">{formatCrypto(h.quantidade)}</td>
                          <td className="px-4 py-3 text-right text-zinc-400">{formatCurrency(h.preco_medio_brl ?? 0)}</td>
                          <td className="px-4 py-3 text-right text-zinc-300">{formatCurrency(precoAtual)}</td>
                          <td className="px-4 py-3 text-right font-medium text-white">{formatCurrency(valor)}</td>
                          <td className={`px-4 py-3 text-right font-medium ${pl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {pl >= 0 ? "+" : ""}{formatCurrency(pl)} ({plPctItem >= 0 ? "+" : ""}{plPctItem.toFixed(1)}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingWallet(null); }}
        title={editingWallet ? "Editar carteira" : "Nova carteira"}
      >
        <WalletForm
          wallet={editingWallet}
          onSuccess={handleFormSuccess}
          onCancel={() => { setModalOpen(false); setEditingWallet(null); }}
        />
      </Modal>
    </div>
  );
}
