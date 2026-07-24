"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" }).format(value);
}

interface Props {
  symbol: string;
  currency?: "USD" | "BRL";
}

export default function CryptoEvolutionChart({ symbol, currency = "USD" }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: history } = await supabase
        .from("price_history")
        .select("*")
        .eq("simbolo", symbol)
        .order("timestamp", { ascending: true })
        .limit(200);

      if (history) {
        const priceKey = currency === "USD" ? "preco_usd" : "preco_brl";
        setData(
          history.map((h) => ({
            date: new Date(h.timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            preco: h[priceKey],
          })),
        );
      }
      setLoading(false);
    };
    fetchData();
  }, [symbol, currency, supabase]);

  if (loading) return <LoadingSpinner className="py-12" />;

  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Aguardando dados. Sincronize os preços primeiro.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis
          tick={{ fill: "#71717a", fontSize: 11 }}
          tickFormatter={(v: number) => formatUSD(v)}
          width={70}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: any) => [
            new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value)),
            symbol,
          ]}
          labelStyle={{ color: "#a1a1aa" }}
        />
        <Line type="monotone" dataKey="preco" stroke="#8b5cf6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
