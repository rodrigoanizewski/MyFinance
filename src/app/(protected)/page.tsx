import { createServer } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";

export default async function DashboardPage() {
  const supabase = await createServer();

  const [
    { data: accounts },
    { data: transactions },
    { data: investments },
    { data: cryptoHoldings },
    { data: fixedAssets },
    { data: debts },
    { data: goals },
    { data: subscriptions },
  ] = await Promise.all([
    supabase.from("accounts").select("*"),
    supabase.from("transactions").select("*").order("data", { ascending: false }),
    supabase.from("investments").select("*"),
    supabase.from("crypto_holdings").select("*"),
    supabase.from("fixed_assets").select("*"),
    supabase.from("debts").select("*"),
    supabase.from("goals").select("*"),
    supabase.from("recurring_transactions").select("*").eq("ativo", true),
  ]);

  const totalFiat =
    accounts
      ?.filter((a) => ["corrente", "poupanca", "corretora"].includes(a.tipo))
      .reduce((sum) => sum, 0) ?? 0;

  const totalInvestido =
    investments?.reduce(
      (sum, i) => sum + (i.preco_atual ?? i.preco_medio) * i.quantidade,
      0,
    ) ?? 0;

  const totalCripto =
    cryptoHoldings?.reduce(
      (sum, h) =>
        sum +
        h.quantidade * (h.preco_atual_brl ?? h.preco_medio_brl ?? 0),
      0,
    ) ?? 0;

  const totalBens =
    fixedAssets?.reduce((sum, a) => sum + (a.valor_estimado ?? 0), 0) ?? 0;

  const patrimonioTotal = totalFiat + totalInvestido + totalCripto + totalBens;

  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const despesasMes =
    transactions
      ?.filter((t) => t.tipo === "despesa" && t.data.startsWith(mesAtual))
      .reduce((sum, t) => sum + t.valor, 0) ?? 0;

  const receitasMes =
    transactions
      ?.filter((t) => t.tipo === "receita" && t.data.startsWith(mesAtual))
      .reduce((sum, t) => sum + t.valor, 0) ?? 0;

  const saldoLivre = receitasMes - despesasMes;

  const liquidAccounts = accounts?.filter((a) => a.liquida) ?? [];
  const totalLiquido = liquidAccounts.length > 0 ? patrimonioTotal : 0;
  const liquidezPct =
    patrimonioTotal > 0 ? (totalLiquido / patrimonioTotal) * 100 : 0;

  const totalDebts =
    debts?.reduce((sum, d) => sum + d.valor_restante, 0) ?? 0;

  const alertas: string[] = [];

  if (liquidezPct < 30 && patrimonioTotal > 0) {
    alertas.push(`Liquidez baixa: ${liquidezPct.toFixed(0)}% do patrimônio`);
  }

  subscriptions?.forEach((s) => {
    if (s.proxima_data) {
      const nextDate = new Date(s.proxima_data);
      const diffDays = Math.ceil(
        (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays >= 0 && diffDays <= 7) {
        alertas.push(
          `${s.nome} vence em ${diffDays === 0 ? "hoje" : `${diffDays} dia(s)`}`,
        );
      }
    }
  });

  debts?.forEach((d) => {
    if (d.vencimento) {
      const vencDate = new Date(d.vencimento);
      const diffDays = Math.ceil(
        (vencDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays >= 0 && diffDays <= 15) {
        alertas.push(
          `Parcela de ${d.nome} vence em ${diffDays === 0 ? "hoje" : `${diffDays} dia(s)`}`,
        );
      }
    }
  });

  goals?.forEach((g) => {
    const gap = g.valor_alvo - g.valor_atual;
    if (
      g.data_alvo &&
      gap > 0 &&
      g.valor_alvo > 0
    ) {
      const targetDate = new Date(g.data_alvo);
      const diffMonths =
        (targetDate.getFullYear() - now.getFullYear()) * 12 +
        (targetDate.getMonth() - now.getMonth());
      if (diffMonths > 0 && diffMonths <= 6) {
        alertas.push(
          `${g.nome}: faltam ${formatCurrency(gap)} (${diffMonths} ${diffMonths === 1 ? "mês" : "meses"})`,
        );
      }
    }
  });

  const summaryCards = [
    { label: "Patrimônio Total", value: formatCurrency(patrimonioTotal), color: "emerald" },
    { label: "Total Investido", value: formatCurrency(totalInvestido), color: "blue" },
    { label: "Total em Cripto", value: formatCurrency(totalCripto), color: "violet" },
    { label: "Despesas do Mês", value: formatCurrency(despesasMes), color: "red" },
    { label: "Saldo Livre", value: formatCurrency(saldoLivre), color: "amber" },
    { label: "Receita do Mês", value: formatCurrency(receitasMes), color: "emerald" },
    { label: "Liquidez", value: `${liquidezPct.toFixed(0)}%`, color: "cyan" },
    { label: "Dívidas", value: formatCurrency(totalDebts), color: "red" },
  ];

  const colorBorderMap: Record<string, string> = {
    emerald: "border-l-emerald-500",
    blue: "border-l-blue-500",
    violet: "border-l-violet-500",
    red: "border-l-red-500",
    amber: "border-l-amber-500",
    cyan: "border-l-cyan-500",
  };

  const isEmpty =
    accounts?.length === 0 &&
    (transactions?.length ?? 0) === 0 &&
    (investments?.length ?? 0) === 0 &&
    (cryptoHoldings?.length ?? 0) === 0 &&
    (fixedAssets?.length ?? 0) === 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">
        Visão Geral
      </h1>

      {isEmpty ? (
        <Card className="text-center py-12">
          <p className="text-lg font-medium text-zinc-300 mb-2">
            Bem-vindo ao MyFinance!
          </p>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Comece adicionando suas contas em <strong>Patrimônio</strong>,
            criando categorias em <strong>Configurações</strong> e registrando
            transações. Os cards e alertas aparecerão automaticamente aqui.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-xl border border-zinc-800 bg-zinc-900 p-4 border-l-4 ${colorBorderMap[card.color]}`}
              >
                <p className="text-xs text-zinc-400">{card.label}</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-sm font-semibold text-zinc-300">
                Pontos de Atenção
              </h2>
              {alertas.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500">
                  Nenhum alerta no momento.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {alertas.map((a, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-lg bg-amber-900/20 px-3 py-2 text-sm text-amber-400"
                    >
                      <span className="mt-0.5 shrink-0">!</span>
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <h2 className="text-sm font-semibold text-zinc-300">
                Composição do Patrimônio
              </h2>
              {patrimonioTotal === 0 ? (
                <p className="mt-4 text-sm text-zinc-500">
                  Sem dados para exibir.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {[
                    {
                      label: "Contas",
                      value: totalFiat,
                      pct: (totalFiat / patrimonioTotal) * 100,
                      color: "bg-emerald-500",
                    },
                    {
                      label: "Investimentos",
                      value: totalInvestido,
                      pct: (totalInvestido / patrimonioTotal) * 100,
                      color: "bg-blue-500",
                    },
                    {
                      label: "Cripto",
                      value: totalCripto,
                      pct: (totalCripto / patrimonioTotal) * 100,
                      color: "bg-violet-500",
                    },
                    {
                      label: "Bens",
                      value: totalBens,
                      pct: (totalBens / patrimonioTotal) * 100,
                      color: "bg-amber-500",
                    },
                  ]
                    .filter((i) => i.value > 0)
                    .map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-zinc-400">{item.label}</span>
                          <span className="text-zinc-300">
                            {formatCurrency(item.value)} ({item.pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800">
                          <div
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${Math.min(item.pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
