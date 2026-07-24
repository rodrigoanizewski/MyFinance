"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#a855f7", "#14b8a6", "#eab308"];

function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

interface Props {
  data: { name: string; value: number }[];
}

export default function CryptoCompositionChart({ data }: Props) {
  if (!data.length) {
    return <p className="py-8 text-center text-sm text-zinc-500">Sem dados para exibir.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: any) => [formatUSD(Number(value)), "USD"]}
          labelStyle={{ color: "#a1a1aa" }}
        />
        <Legend
          formatter={(value: string) => <span style={{ color: "#a1a1aa", fontSize: "12px" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
