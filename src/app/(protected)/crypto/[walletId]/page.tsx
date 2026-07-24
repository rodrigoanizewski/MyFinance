"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ArrowLeft, Wallet } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import WalletForm from "@/components/forms/WalletForm";
import CryptoTransactionForm from "@/components/forms/CryptoTransactionForm";
import type { CryptoWallet, CryptoHolding, CryptoTransaction } from "@/lib/services/crypto";
import { formatCurrency, formatCrypto } from "@/lib/utils/format";

const TIPO_LABELS: Record<string, string> = {
  exchange: "Exchange",
  wallet_propria: "Wallet Própria",
  cold_wallet: "Cold Wallet",
};

const TX_TIPO_LABELS: Record<string, string> = {
  compra: "Compra",
  venda: "Venda",
  transferencia: "Transferência",
  stake: "Stake",
  unstake: "Unstake",
  swap: "Swap",
  airdrop: "Airdrop",
  taxa: "Taxa",
};

const TX_TIPO_COLORS: Record<string, string> = {
  compra: "text-emerald-400",
  venda: "text-red-400",
  transferencia: "text-blue-400",
  stake: "text-amber-400",
  unstake: "text-emerald-400",
  swap: "text-violet-400",
  airdrop: "text-cyan-400",
  taxa: "text-zinc-400",
};

export default function WalletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const walletId = params.walletId as string;

  const [wallet, setWallet] = useState<CryptoWallet | null>(null);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [priceCache, setPriceCache] = useState<Record<string, { preco_usd: number; preco_brl: number }>>({});
  const [loading, setLoading] = useState(true);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    setLoading(true);

    const [wRes, allWallets, hRes, tRes, pRes] = await Promise.all([
      supabase.from("crypto_wallets").select("*").eq("id", walletId).single(),
      supabase.from("crypto_wallets").select("*").order("nome"),
      supabase.from("crypto_holdings").select("*").eq("wallet_id", walletId).order("simbolo"),
      supabase.from("crypto_transactions").select("*").eq("wallet_id", walletId).order("data", { ascending: false }),
      supabase.from("price_cache").select("*"),
    ]);

    if (wRes.data) setWallet(wRes.data);
    if (allWallets.data) setWallets(allWallets.data);
    if (hRes.data) setHoldings(hRes.data);
    if (tRes.data) setTransactions(tRes.data);
    if (pRes.data) {
      const cache: Record<string, { preco_usd: number; preco_brl: number }> = {};
      pRes.data.forEach((p) => { cache[p.simbolo] = { preco_usd: p.preco_usd ?? 0, preco_brl: p.preco_brl ?? 0 }; });
      setPriceCache(cache);
    }

    setLoading(false);
  }, [supabase, walletId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleDeleteTx = async (id: string) => {
    if (!confirm("Excluir esta transação? As posições serão recalculadas.")) return;

    const tx = transactions.find((t) => t.id === id);
    await supabase.from("crypto_transactions").delete().eq("id", id);

    if (tx) {
      if (tx.tipo === "transferencia") {
        const related = await supabase
          .from("crypto_transactions")
          .select("id")
          .eq("simbolo", tx.simbolo)
          .eq("quantidade", tx.quantidade)
          .eq("data", tx.data)
          .neq("id", id)
          .maybeSingle();
        if (related.data) {
          await supabase.from("crypto_transactions").delete().eq("id", related.data.id);
        }
      }
    }

    refresh();
  };

  const handleFormSuccess = () => { setTxModalOpen(false); setEditingTx(null); refresh(); };
  const handleEditSuccess = () => { setEditModalOpen(false); refresh(); };

  const totalValue = holdings.reduce((sum: number, h: any) => {
    const preco = priceCache[h.simbolo]?.preco_brl ?? h.preco_medio_brl ?? 0;
    return sum + h.quantidade * preco;
  }, 0);

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!wallet) return <div className="p-6 text-white">Carteira não encontrada.</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/crypto" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">{wallet.nome}</h1>
          <p className="text-sm text-zinc-400">
            {TIPO_LABELS[wallet.tipo] ?? wallet.tipo}
            {wallet.observacao && ` · ${wallet.observacao}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditModalOpen(true)}>
            <Pencil size={14} />
          </Button>
          <Button size="sm" onClick={() => { setEditingTx(null); setTxModalOpen(true); }}>
            <Plus size={16} /> Transação
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs text-zinc-400">Valor estimado</p>
          <p className="mt-1 text-lg font-bold text-white">{formatCurrency(totalValue)}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-400">Ativos diferentes</p>
          <p className="mt-1 text-lg font-bold text-white">{holdings.filter((h: any) => h.quantidade > 0).length}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-400">Transações</p>
          <p className="mt-1 text-lg font-bold text-white">{transactions.length}</p>
        </Card>
      </div>

      {/* Holdings */}
      {holdings.filter((h: any) => h.quantidade > 0).length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Posições</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Ativo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Qtd</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Preço Médio</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Preço Atual</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Valor</th>
                </tr>
              </thead>
              <tbody>
                {holdings.filter((h: any) => h.quantidade > 0).map((h: any) => {
                  const precoAtual = priceCache[h.simbolo]?.preco_brl ?? h.preco_medio_brl ?? 0;
                  const valor = h.quantidade * precoAtual;
                  return (
                    <tr key={h.id} className="border-b border-zinc-800/50">
                      <td className="px-4 py-3 font-medium text-white">{h.simbolo}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{formatCrypto(h.quantidade)}</td>
                      <td className="px-4 py-3 text-right text-zinc-400">{formatCurrency(h.preco_medio_brl ?? 0)}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{formatCurrency(precoAtual)}</td>
                      <td className="px-4 py-3 text-right font-medium text-white">{formatCurrency(valor)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Transações</h2>
        {transactions.length === 0 ? (
          <EmptyState
            title="Nenhuma transação"
            description="Registre compras, vendas, transferências e outras movimentações."
            action={<Button size="sm" onClick={() => { setEditingTx(null); setTxModalOpen(true); }}><Plus size={16} /> Nova transação</Button>}
          />
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-xs font-semibold uppercase ${TX_TIPO_COLORS[tx.tipo]}`}>
                    {TX_TIPO_LABELS[tx.tipo]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">
                      {tx.tipo === "taxa" ? "Taxa" : tx.tipo === "swap" ? `${tx.simbolo}` : tx.simbolo}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-500">
                        {formatCrypto(tx.quantidade)} {tx.simbolo}
                      </span>
                      {tx.preco_unitario && (
                        <span className="text-xs text-zinc-600">@ {formatCurrency(tx.preco_unitario)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    {tx.preco_unitario ? (
                      <p className="text-sm font-semibold text-white">
                        {formatCurrency(tx.quantidade * tx.preco_unitario)}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-400">—</p>
                    )}
                    <p className="text-xs text-zinc-500">
                      {new Date(tx.data).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDeleteTx(tx.id)}
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
      </div>

      {/* Transaction modal */}
      <Modal
        open={txModalOpen}
        onClose={() => { setTxModalOpen(false); setEditingTx(null); }}
        title={editingTx ? "Editar transação" : "Nova transação"}
      >
        <CryptoTransactionForm
          tx={editingTx}
          walletId={walletId}
          wallets={wallets}
          onSuccess={handleFormSuccess}
          onCancel={() => { setTxModalOpen(false); setEditingTx(null); }}
        />
      </Modal>

      {/* Edit wallet modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar carteira"
      >
        <WalletForm
          wallet={wallet}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
