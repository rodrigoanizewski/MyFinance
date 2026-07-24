export default async function DashboardPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">
        Visão Geral
      </h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Patrimônio Total", value: "R$ 0,00", color: "emerald" },
          { label: "Total Investido", value: "R$ 0,00", color: "blue" },
          { label: "Total em Cripto", value: "R$ 0,00", color: "violet" },
          { label: "Despesas do Mês", value: "R$ 0,00", color: "red" },
        ].map((card) => {
          const colorMap: Record<string, string> = {
            emerald: "border-l-emerald-500",
            blue: "border-l-blue-500",
            violet: "border-l-violet-500",
            red: "border-l-red-500",
          };
          return (
            <div
              key={card.label}
              className={`rounded-xl border border-zinc-800 bg-zinc-900 p-4 border-l-4 ${colorMap[card.color]}`}
            >
              <p className="text-xs text-zinc-400">{card.label}</p>
              <p className="mt-1 text-lg font-bold text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-300">Pontos de Atenção</h2>
          <p className="mt-4 text-sm text-zinc-500">
            Nenhum alerta no momento. Conforme você adicionar assinaturas, dívidas e metas, os alertas aparecerão aqui.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-300">Composição do Patrimônio</h2>
          <p className="mt-4 text-sm text-zinc-500">
            Gráfico aparecerá aqui conforme os dados forem cadastrados.
          </p>
        </div>
      </div>
    </div>
  );
}
