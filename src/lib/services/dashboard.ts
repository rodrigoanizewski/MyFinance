export async function getDashboardData(supabase: any) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .single();

  const { data: accounts } = await supabase.from("accounts").select("*");
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*");
  const { data: investments } = await supabase.from("investments").select("*");
  const { data: cryptoHoldings } = await supabase
    .from("crypto_holdings")
    .select("*");
  const { data: fixedAssets } = await supabase.from("fixed_assets").select("*");
  const { data: debts } = await supabase.from("debts").select("*");
  const { data: goals } = await supabase.from("goals").select("*");
  const { data: subscriptions } = await supabase
    .from("recurring_transactions")
    .select("*");

  const totalFiat = accounts
    ?.filter((a: any) => ["corrente", "poupanca"].includes(a.tipo))
    .reduce((sum: number, a: any) => sum, 0) ?? 0;

  const totalInvestido =
    investments?.reduce(
      (sum: number, i: any) => sum + (i.preco_atual ?? i.preco_medio) * i.quantidade,
      0,
    ) ?? 0;

  const totalCripto =
    cryptoHoldings?.reduce(
      (sum: number, h: any) =>
        sum + h.quantidade * (h.preco_atual_brl ?? h.preco_medio_brl ?? 0),
      0,
    ) ?? 0;

  const totalBens =
    fixedAssets?.reduce(
      (sum: number, a: any) => sum + (a.valor_estimado ?? 0),
      0,
    ) ?? 0;

  const patrimonioTotal = totalFiat + totalInvestido + totalCripto + totalBens;

  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const despesasMes =
    transactions
      ?.filter(
        (t: any) => t.tipo === "despesa" && t.data.startsWith(mesAtual),
      )
      .reduce((sum: number, t: any) => sum + t.valor, 0) ?? 0;

  const receitasMes =
    transactions
      ?.filter(
        (t: any) => t.tipo === "receita" && t.data.startsWith(mesAtual),
      )
      .reduce((sum: number, t: any) => sum + t.valor, 0) ?? 0;

  const saldoLivre = receitasMes - despesasMes;

  return {
    profile,
    patrimonioTotal,
    totalInvestido,
    totalCripto,
    totalBens,
    totalFiat,
    despesasMes,
    receitasMes,
    saldoLivre,
    debts,
    goals,
    subscriptions,
  };
}
