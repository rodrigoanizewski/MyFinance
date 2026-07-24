"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useCallback } from "react";
import type { CryptoWallet, CryptoHolding, CryptoTransaction } from "@/lib/services/crypto";

export function useCrypto() {
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [transactions, setTransactions] = useState<CryptoTransaction[]>([]);
  const [priceCache, setPriceCache] = useState<Record<string, { preco_usd: number; preco_brl: number }>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    setLoading(true);

    const [wRes, hRes, pRes] = await Promise.all([
      supabase.from("crypto_wallets").select("*").order("nome"),
      supabase.from("crypto_holdings").select("*").order("simbolo"),
      supabase.from("price_cache").select("*"),
    ]);

    if (wRes.data) setWallets(wRes.data);
    if (hRes.data) setHoldings(hRes.data);

    const cache: Record<string, { preco_usd: number; preco_brl: number }> = {};
    if (pRes.data) {
      pRes.data.forEach((p) => {
        cache[p.simbolo] = {
          preco_usd: p.preco_usd ?? 0,
          preco_brl: p.preco_brl ?? 0,
        };
      });
    }
    setPriceCache(cache);

    setLoading(false);
  }, [supabase]);

  return { wallets, holdings, transactions, priceCache, loading, refresh, setHoldings, setTransactions };
}
