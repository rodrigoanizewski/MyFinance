// Edge Function: atualiza preços de cripto via CoinGecko
// Deploy: supabase functions deploy update-crypto-prices
// Agendamento: via Supabase Dashboard (Cron) a cada 10-15 min
//
// Variáveis de ambiente necessárias (configurar no Supabase Dashboard):
//   SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (já padrão do Supabase)
//   COINGECKO_BASE_URL=https://api.coingecko.com/api/v3 (opcional, padrão usado no código)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const COINGECKO_BASE =
  Deno.env.get("COINGECKO_BASE_URL") ?? "https://api.coingecko.com/api/v3";

const SUPPORTED_COINS: string[] = [
  "bitcoin",
  "ethereum",
  "tether",
  "solana",
  "bnb",
  "ripple",
  "cardano",
  "avalanche-2",
  "polkadot",
  "chainlink",
  "matic-network",
  "uniswap",
  "litecoin",
  "bitcoin-cash",
  "stellar",
  "cosmos",
  "monero",
  "near",
  "algorand",
  "vechain",
  "filecoin",
  "the-graph",
  "aave",
  "maker",
  "eos",
  "tezos",
  "axie-infinity",
  "decentraland",
  "the-sandbox",
  "enjincoin",
];

const COIN_LIST: Record<string, string> = {
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
  USDTUSDT: "tether",
  SOLUSDT: "solana",
  BNBUSDT: "bnb",
  XRPUSDT: "ripple",
  ADAUSDT: "cardano",
  AVAXUSDT: "avalanche-2",
  DOTUSDT: "polkadot",
  LINKUSDT: "chainlink",
  MATICUSDT: "matic-network",
  UNIUSDT: "uniswap",
  LTCUSDT: "litecoin",
  BCHUSDT: "bitcoin-cash",
  XLMUSDT: "stellar",
  ATOMUSDT: "cosmos",
  XMRUSDT: "monero",
  NEARUSDT: "near",
  ALGOUSDT: "algorand",
  VETUSDT: "vechain",
  FILUSDT: "filecoin",
  GRTUSDT: "the-graph",
  AAVEUSDT: "aave",
  MKRUSDT: "maker",
  EOSUSDT: "eos",
  XTZUSDT: "tezos",
  AXSUSDT: "axie-infinity",
  MANAUSDT: "decentraland",
  SANDUSDT: "the-sandbox",
  ENJUSDT: "enjincoin",
};

// Mapeia coin_id -> símbolo (BTC, ETH, etc)
const COIN_ID_TO_SYMBOL: Record<string, string> = {};
for (const [symbol, id] of Object.entries(COIN_LIST)) {
  COIN_ID_TO_SYMBOL[id] = symbol.replace("USDT", "");
}

// Mapeia símbolo -> coin_id
const SYMBOL_TO_COIN_ID: Record<string, string> = {};
for (const [symbol, id] of Object.entries(COIN_LIST)) {
  SYMBOL_TO_COIN_ID[symbol] = id;
}

Deno.serve(async (_req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Buscar preços em USD da CoinGecko
    const coinIds = SUPPORTED_COINS.join(",");
    const url =
      `${COINGECKO_BASE}/simple/price?ids=${coinIds}&vs_currencies=usd`;
    const response = await fetch(url);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `CoinGecko returned ${response.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const prices: Record<string, { usd: number }> = await response.json();

    // 2. Buscar cotação USD/BRL via CoinGecko
    const brlUrl = `${COINGECKO_BASE}/simple/price?ids=tether&vs_currencies=brl`;
    const brlResponse = await fetch(brlUrl);
    let usdToBrl = 5.0; // fallback
    if (brlResponse.ok) {
      const brlData = await brlResponse.json();
      usdToBrl = brlData.tether?.brl ?? 5.0;
    }

    // 3. Atualizar price_cache e inserir em price_history
    const now = new Date().toISOString();
    const upserts: Array<{ simbolo: string; preco_usd: number; preco_brl: number; atualizado_em: string }> = [];
    const historyInserts: Array<{ simbolo: string; preco_usd: number; preco_brl: number; timestamp: string }> = [];

    for (const [pair, coinId] of Object.entries(COIN_LIST)) {
      const priceData = prices[coinId];
      if (!priceData) continue;

      const precoUsd = priceData.usd;
      const precoBrl = precoUsd * usdToBrl;
      const simbolo = pair.replace("USDT", "");

      upserts.push({
        simbolo,
        preco_usd: precoUsd,
        preco_brl: precoBrl,
        atualizado_em: now,
      });

      historyInserts.push({
        simbolo,
        preco_usd: precoUsd,
        preco_brl: precoBrl,
        timestamp: now,
      });
    }

    // Upsert price_cache
    const { error: cacheError } = await supabase
      .from("price_cache")
      .upsert(upserts, { onConflict: "simbolo" });

    if (cacheError) {
      console.error("Error upserting price_cache:", cacheError);
    }

    // Insert price_history
    const { error: historyError } = await supabase
      .from("price_history")
      .insert(historyInserts);

    if (historyError) {
      console.error("Error inserting price_history:", historyError);
    }

    // 4. Atualizar exchange rate USD/BRL
    const { error: rateError } = await supabase
      .from("exchange_rates")
      .upsert(
        { par: "USD_BRL", taxa: usdToBrl, atualizado_em: now },
        { onConflict: "par" },
      );

    if (rateError) {
      console.error("Error upserting exchange_rates:", rateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: upserts.length,
        history_records: historyInserts.length,
        usd_to_brl: usdToBrl,
        timestamp: now,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
