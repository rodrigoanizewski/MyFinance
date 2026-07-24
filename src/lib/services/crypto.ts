import { createServer } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type CryptoWallet = Tables<"crypto_wallets">;
export type CryptoHolding = Tables<"crypto_holdings">;
export type CryptoTransaction = Tables<"crypto_transactions">;

export async function getWallets() {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("crypto_wallets")
    .select("*")
    .order("nome");
  if (error) throw error;
  return data;
}

export async function getWallet(id: string) {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("crypto_wallets")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getHoldings(walletId?: string) {
  const supabase = await createServer();
  let query = supabase
    .from("crypto_holdings")
    .select("*, crypto_wallets(nome), price_cache!inner(preco_usd, preco_brl, atualizado_em)")
    .order("simbolo");

  if (walletId) {
    query = query.eq("wallet_id", walletId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getTransactions(walletId?: string) {
  const supabase = await createServer();
  let query = supabase
    .from("crypto_transactions")
    .select("*")
    .order("data", { ascending: false });

  if (walletId) {
    query = query.eq("wallet_id", walletId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getPriceCache() {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from("price_cache")
    .select("*")
    .order("simbolo");
  if (error) throw error;
  return data;
}

export async function getPriceHistory(simbolo?: string) {
  const supabase = await createServer();
  let query = supabase
    .from("price_history")
    .select("*")
    .order("timestamp", { ascending: true });

  if (simbolo) {
    query = query.eq("simbolo", simbolo);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getExchangeRate() {
  const supabase = await createServer();
  const { data } = await supabase
    .from("exchange_rates")
    .select("*")
    .eq("par", "USD_BRL")
    .single();
  return data?.taxa ?? 5.0;
}

export function calcularPrecoMedio(
  quantidadeAtual: number,
  precoMedioAtual: number,
  novaQuantidade: number,
  precoNovo: number,
  taxa: number = 0,
): number {
  if (quantidadeAtual <= 0 && novaQuantidade <= 0) return 0;
  const custoAnterior = quantidadeAtual * precoMedioAtual;
  const custoNovo = novaQuantidade * precoNovo + taxa;
  const qtdTotal = quantidadeAtual + novaQuantidade;
  if (qtdTotal <= 0) return 0;
  return (custoAnterior + custoNovo) / qtdTotal;
}

export function calcularPL(
  quantidade: number,
  precoMedio: number,
  precoAtual: number,
): { lucro: number; percentual: number } {
  const custo = quantidade * precoMedio;
  const valorAtual = quantidade * precoAtual;
  const lucro = valorAtual - custo;
  const percentual = custo > 0 ? (lucro / custo) * 100 : 0;
  return { lucro, percentual };
}
