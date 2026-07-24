import { createAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

const COIN_LIST: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  SOL: "solana",
  BNB: "bnb",
  XRP: "ripple",
  ADA: "cardano",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  LINK: "chainlink",
  MATIC: "matic-network",
  UNI: "uniswap",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  XLM: "stellar",
  ATOM: "cosmos",
  XMR: "monero",
  NEAR: "near",
  ALGO: "algorand",
  VET: "vechain",
  FIL: "filecoin",
  GRT: "the-graph",
  AAVE: "aave",
  MKR: "maker",
  EOS: "eos",
  XTZ: "tezos",
  AXS: "axie-infinity",
  MANA: "decentraland",
  SAND: "the-sandbox",
  ENJ: "enjincoin",
};

export async function GET() {
  try {
    const supabase = createAdmin();

    const coinIds = Object.values(COIN_LIST).join(",");
    const url = `${COINGECKO_BASE}/simple/price?ids=${coinIds}&vs_currencies=usd`;
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `CoinGecko returned ${response.status}` },
        { status: 502 },
      );
    }

    const prices: Record<string, { usd: number }> = await response.json();

    const brlUrl = `${COINGECKO_BASE}/simple/price?ids=tether&vs_currencies=brl`;
    const brlResponse = await fetch(brlUrl);
    let usdToBrl = 5.0;
    if (brlResponse.ok) {
      const brlData = await brlResponse.json();
      usdToBrl = brlData.tether?.brl ?? 5.0;
    }

    const now = new Date().toISOString();
    const upserts: Array<{
      simbolo: string;
      preco_usd: number;
      preco_brl: number;
      atualizado_em: string;
    }> = [];
    const historyInserts: Array<{
      simbolo: string;
      preco_usd: number;
      preco_brl: number;
      timestamp: string;
    }> = [];

    for (const [symbol, coinId] of Object.entries(COIN_LIST)) {
      const priceData = prices[coinId];
      if (!priceData) continue;

      const precoUsd = priceData.usd;
      const precoBrl = precoUsd * usdToBrl;

      upserts.push({
        simbolo: symbol,
        preco_usd: precoUsd,
        preco_brl: precoBrl,
        atualizado_em: now,
      });

      historyInserts.push({
        simbolo: symbol,
        preco_usd: precoUsd,
        preco_brl: precoBrl,
        timestamp: now,
      });
    }

    const { error: cacheError } = await supabase
      .from("price_cache")
      .upsert(upserts, { onConflict: "simbolo" });

    if (cacheError) {
      console.error("price_cache error:", cacheError);
    }

    const { error: historyError } = await supabase
      .from("price_history")
      .insert(historyInserts);

    if (historyError) {
      console.error("price_history error:", historyError);
    }

    const { error: rateError } = await supabase
      .from("exchange_rates")
      .upsert(
        { par: "USD_BRL", taxa: usdToBrl, atualizado_em: now },
        { onConflict: "par" },
      );

    if (rateError) {
      console.error("exchange_rates error:", rateError);
    }

    return NextResponse.json({
      success: true,
      updated: upserts.length,
      history_records: historyInserts.length,
      usd_to_brl: usdToBrl,
      timestamp: now,
      samples: upserts.slice(0, 3),
    });
  } catch (error) {
    console.error("Update prices error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
