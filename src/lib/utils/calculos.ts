export function precoMedio(
  quantidadeAtual: number,
  precoMedioAtual: number,
  novaQuantidade: number,
  precoNovo: number,
  taxa: number = 0,
): number {
  const custoTotalExistente = quantidadeAtual * precoMedioAtual;
  const custoTotalNovo = novaQuantidade * precoNovo + taxa;
  const quantidadeTotal = quantidadeAtual + novaQuantidade;

  if (quantidadeTotal <= 0) return 0;
  return (custoTotalExistente + custoTotalNovo) / quantidadeTotal;
}

export function lucroNaoRealizado(
  quantidade: number,
  precoMedio: number,
  precoAtual: number,
): { lucroBrl: number; percentual: number } {
  const custoTotal = quantidade * precoMedio;
  const valorAtual = quantidade * precoAtual;
  const lucroBrl = valorAtual - custoTotal;
  const percentual = custoTotal > 0 ? (lucroBrl / custoTotal) * 100 : 0;

  return { lucroBrl, percentual };
}

export function gapMeta(valorAlvo: number, valorAtual: number): number {
  return valorAlvo - valorAtual;
}

export function percentualMeta(valorAlvo: number, valorAtual: number): number {
  if (valorAlvo <= 0) return 0;
  return (valorAtual / valorAlvo) * 100;
}

export function liquidezPercentual(
  patrimonioLiquido: number,
  patrimonioTotal: number,
): number {
  if (patrimonioTotal <= 0) return 0;
  return (patrimonioLiquido / patrimonioTotal) * 100;
}
