"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { formatCurrency } from "@/lib/utils/format";

interface Props {
  symbol: string;
}

export default function CryptoEvolutionChart({ symbol }: Props) {
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
        setData(
          history.map((h) => ({
            date: new Date(h.timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            preco: h.preco_brl,
          })),
        );
      }
      setLoading(false);
    };
    fetchData();
  }, [symbol, supabase]);

  if (loading) return <LoadingSpinner className="py-12" />;

  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Aguardando dados de preço. A Edge Function do CoinGecko atualizará automaticamente.
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
          tickFormatter={(v: number) =>
            new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(v)
          }
          width={70}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: any) => [formatCurrency(Number(value)), symbol]}
          labelStyle={{ color: "#a1a1aa" }}
        />
        <Line type="monotone" dataKey="preco" stroke="#8b5cf6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
