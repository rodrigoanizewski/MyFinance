"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AlertBadge() {
  const [count, setCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const checkAlerts = async () => {
      const now = new Date();
      let c = 0;

      const { data: subs } = await supabase
        .from("recurring_transactions")
        .select("proxima_data, ativo")
        .eq("ativo", true);

      if (subs) {
        subs.forEach((s) => {
          if (s.proxima_data) {
            const diff = Math.ceil((new Date(s.proxima_data).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff <= 7) c++;
          }
        });
      }

      const { data: debts } = await supabase.from("debts").select("vencimento");
      if (debts) {
        debts.forEach((d) => {
          if (d.vencimento) {
            const diff = Math.ceil((new Date(d.vencimento).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff <= 15) c++;
          }
        });
      }

      setCount(c);
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [supabase]);

  if (count === 0) return null;

  return (
    <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
      {count}
    </span>
  );
}
