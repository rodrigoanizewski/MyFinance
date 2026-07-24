# PROMPT DE DESENVOLVIMENTO — App de Controle Financeiro Pessoal

> Cole este documento inteiro como prompt inicial no OpenCode conectado ao DeepSeek V4 Pro. Ele contém contexto, escopo, modelagem de dados e ordem de desenvolvimento. Peça para o agente confirmar entendimento e propor o plano de arquivos antes de começar a codar.

---

## 1. Contexto e objetivo

Quero um aplicativo web pessoal de controle financeiro completo, para uso individual (apenas eu), acessível tanto pelo computador quanto pelo celular. Hoje eu controlo tudo em planilha (gastos, ganhos, e principalmente movimentações de criptomoedas) e quero migrar 100% para este app.

O app deve me dar visão consolidada de:
- Patrimônio total (fiat + investimentos + cripto + bens)
- Fluxo de caixa mensal (entradas, saídas, saldo livre)
- Portfólio de criptomoedas com preço atualizado automaticamente
- Dívidas, assinaturas recorrentes e objetivos financeiros
- Alertas automáticos sobre pontos de atenção (baixa liquidez, gap de meta, vencimentos)

Referência visual de estrutura (não é para copiar, é ponto de partida): um dashboard com sidebar escura à esquerda, cards coloridos de resumo no topo (patrimônio, investido, despesas), painel de faturas/assinaturas, e um painel de "resumo consolidado" + "pontos de atenção" lado a lado. Quero que o app supere essa referência, especialmente na parte de cripto, que ali é praticamente inexistente.

---

## 2. Stack técnica recomendada

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend | Next.js (React) + TypeScript + TailwindCSS | Uma base de código só para desktop e mobile via navegador |
| Estilo PWA | manifest.json + service worker | Permite "instalar" o app na tela inicial do celular, com ícone e abertura em tela cheia |
| Backend/DB | Supabase (Postgres) | Auth, banco relacional, Row Level Security, Edge Functions, tudo num único serviço |
| Gráficos | Recharts ou Chart.js | Composição de patrimônio, evolução histórica, alocação de portfólio |
| Preço de cripto | CoinGecko API (gratuita) via Supabase Edge Function agendada | Atualiza preços automaticamente sem exigir chave paga |
| Deploy frontend | Vercel (free tier) | Deploy contínuo integrado ao Next.js |

**Por que PWA e não app nativo (React Native):** entrega mais rápida, um único código, funciona em qualquer celular sem passar por loja de aplicativo. Se no futuro quiser um app nativo de verdade, dá pra migrar depois — mas para uso pessoal isso é over-engineering agora.

---

## 3. Módulos e funcionalidades

### 3.1 Visão Geral (Dashboard)
Cards principais: Patrimônio Total, Total Investido, Total em Cripto (separado, dado seu volume de operações), Despesas do Mês, Saldo Livre, Liquidez, Receita Prevista, A Receber.

Painel "Pontos de Atenção" com regras automáticas, por exemplo:
- Liquidez da carteira abaixo de X%
- Gap entre patrimônio atual e meta definida
- Assinaturas vencendo nos próximos 7 dias
- Dívida com parcela vencendo

Gráfico de composição do patrimônio (pizza: fiat / renda fixa / ações / cripto / bens).

### 3.2 Módulo Cripto (dedicado — este é o diferencial do seu app)
- Cadastro de carteiras/exchanges (ex: Binance, MetaMask, cold wallet)
- Registro de transações: compra, venda, transferência entre carteiras, stake, unstake, swap, airdrop, taxas
- Cálculo automático de preço médio de compra (custo de aquisição) por ativo
- Valor atual de cada posição (quantidade × preço atual em BRL e USD)
- Lucro/prejuízo não realizado por ativo e total
- Histórico de preço atualizado automaticamente via CoinGecko a cada 10–15 minutos (Edge Function agendada, não sob demanda do navegador, para não estourar rate limit)
- Gráfico de alocação por moeda e evolução do valor da carteira cripto ao longo do tempo

### 3.3 Transações (fiat)
- CRUD de receitas e despesas, com categoria, conta, data, descrição e tags
- Suporte a transações recorrentes marcadas como tal
- **Importador de CSV/planilha**: tela de mapeamento de colunas (data, valor, descrição, categoria) para você migrar seu histórico da planilha atual sem digitar tudo de novo

### 3.4 Patrimônio e Investimentos
- Contas (corrente, poupança, corretora)
- Investimentos tradicionais (renda fixa, ações, fundos, FIIs): quantidade, preço médio, preço atual
- Bens (imóveis, veículos, outros): valor estimado vs valor de compra

### 3.5 Dívidas
- Empréstimos, financiamentos, cartão de crédito
- Valor total, valor restante, taxa de juros, parcela mensal, vencimento

### 3.6 Faturas e Assinaturas
- Recorrências mensais/anuais com valor, categoria, conta de pagamento e próxima data de vencimento
- Alimenta automaticamente o painel de "pontos de atenção"

### 3.7 Objetivos (Metas financeiras)
- Nome, valor-alvo, valor atual, data-alvo, prioridade
- Cálculo automático do "gap" (quanto falta) exibido no dashboard

### 3.8 Planejamento / Orçamento (opcional, fase avançada)
- Orçamento mensal por categoria com comparação real vs planejado

---

## 4. Modelagem de dados (Supabase / Postgres)

Todas as tabelas abaixo devem ter `user_id uuid references auth.users` e Row Level Security habilitada com policy `auth.uid() = user_id` em SELECT/INSERT/UPDATE/DELETE.

```
profiles
  id uuid (pk, = auth.users.id)
  nome text
  moeda_base text default 'BRL'
  created_at timestamp

accounts (contas)
  id uuid pk
  user_id uuid
  nome text
  tipo text  -- corrente | poupanca | corretora | carteira_cripto | exchange_cripto
  instituicao text
  moeda text default 'BRL'
  liquida boolean default true
  created_at timestamp

categories (categorias)
  id uuid pk
  user_id uuid
  nome text
  tipo text  -- receita | despesa
  cor text
  icone text

transactions (transações fiat)
  id uuid pk
  user_id uuid
  account_id uuid fk -> accounts
  category_id uuid fk -> categories
  tipo text  -- receita | despesa | transferencia
  valor numeric
  moeda text
  data date
  descricao text
  tags text[]
  recorrente boolean default false
  recurring_id uuid fk -> recurring_transactions (nullable)

recurring_transactions (assinaturas/faturas)
  id uuid pk
  user_id uuid
  nome text
  valor numeric
  moeda text
  dia_vencimento int
  frequencia text  -- mensal | anual
  category_id uuid fk
  account_id uuid fk
  ativo boolean default true
  proxima_data date

investments (investimentos tradicionais)
  id uuid pk
  user_id uuid
  account_id uuid fk
  tipo_ativo text  -- renda_fixa | acao | fundo | fii
  nome text
  quantidade numeric
  preco_medio numeric
  preco_atual numeric
  moeda text
  atualizado_em timestamp

crypto_wallets (carteiras/exchanges)
  id uuid pk
  user_id uuid
  nome text
  tipo text  -- exchange | wallet_propria | cold_wallet
  observacao text

crypto_holdings (posições consolidadas por ativo)
  id uuid pk
  user_id uuid
  wallet_id uuid fk
  simbolo text  -- BTC, ETH, SOL...
  quantidade numeric
  preco_medio_brl numeric
  preco_atual_usd numeric
  preco_atual_brl numeric
  atualizado_em timestamp

crypto_transactions (histórico de movimentações)
  id uuid pk
  user_id uuid
  wallet_id uuid fk
  simbolo text
  tipo text  -- compra | venda | transferencia | stake | unstake | swap | airdrop | taxa
  quantidade numeric
  preco_unitario numeric
  taxa numeric
  data timestamp
  notas text

debts (dívidas)
  id uuid pk
  user_id uuid
  nome text
  tipo text  -- emprestimo | cartao | financiamento
  valor_total numeric
  valor_restante numeric
  taxa_juros numeric
  parcela_mensal numeric
  vencimento date

fixed_assets (bens)
  id uuid pk
  user_id uuid
  nome text
  categoria text  -- imovel | veiculo | outro
  valor_estimado numeric
  valor_compra numeric
  data_compra date

goals (objetivos)
  id uuid pk
  user_id uuid
  nome text
  valor_alvo numeric
  valor_atual numeric
  data_alvo date
  prioridade int

price_cache (cache de preços — atualizado por Edge Function)
  simbolo text pk
  preco_usd numeric
  preco_brl numeric
  atualizado_em timestamp

exchange_rates (cotações)
  par text pk  -- ex: USD_BRL
  taxa numeric
  atualizado_em timestamp
```

---

## 5. Segurança (não negociável)

- Row Level Security **ativada em todas as tabelas**, sem exceção.
- Frontend usa apenas a **anon key** do Supabase — nunca a service role key.
- A Edge Function que busca preços de cripto roda no servidor (Supabase) com sua própria chave, isolada do frontend.
- Autenticação via Supabase Auth (email/senha; OAuth Google como opção extra).
- Variáveis sensíveis (chaves de API) sempre em `.env`, nunca commitadas.

---

## 6. Design e UX

- Sidebar escura fixa à esquerda com navegação por seções (Visão Geral, Cripto, Patrimônio, Transações, Dívidas, Assinaturas, Objetivos, Configurações).
- Cards de resumo no topo do dashboard com cores semânticas: verde (patrimônio), azul (investido), roxo (cripto), vermelho (despesas).
- Layout responsivo mobile-first: no celular os cards empilham verticalmente e a sidebar vira menu inferior ou gaveta lateral.
- Gráficos de composição (pizza) e evolução (linha) usando Recharts.
- Modo claro/escuro (opcional, fase final).

---

## 7. Ordem de desenvolvimento sugerida (fases)

1. **Fase 1 — Base**: setup do projeto Next.js + Supabase, autenticação, criação de todas as tabelas com RLS.
2. **Fase 2 — Dashboard e transações fiat**: CRUD de contas, categorias e transações + cards do dashboard funcionando com dados reais.
3. **Fase 3 — Módulo cripto**: carteiras, transações cripto, Edge Function de preço via CoinGecko, cálculo de preço médio e P&L.
4. **Fase 4 — Investimentos, dívidas, bens e objetivos**: CRUDs restantes + integração no cálculo de patrimônio total.
5. **Fase 5 — Assinaturas/faturas e motor de alertas**: recorrências + lógica de "pontos de atenção".
6. **Fase 6 — Importador de planilha**: upload de CSV, mapeamento de colunas, migração do histórico.
7. **Fase 7 — PWA e polimento**: manifest, service worker, responsividade final, deploy no Vercel.

---

## 8. Instruções diretas para o agente (DeepSeek/OpenCode)

- Antes de escrever qualquer código, apresente o plano de pastas/arquivos e confirme comigo.
- Desenvolva fase por fase, na ordem da seção 7, e ao final de cada fase rode/valide antes de avançar.
- Use TypeScript em todo o projeto, com tipagem gerada a partir do schema do Supabase quando possível.
- Toda tela deve funcionar tanto em resolução desktop quanto mobile (testar em viewport estreito).
- Comente no código os pontos onde eu precisarei inserir minhas próprias chaves de API (Supabase URL/anon key, endpoint CoinGecko).
- Não implemente nada de IA/automação que envie meus dados financeiros reais para serviços de terceiros além do Supabase e CoinGecko (preço de mercado público, não dado pessoal).

---

**Fim do prompt.** Peça ao agente para responder confirmando entendimento do escopo completo e propondo a estrutura de pastas antes do primeiro código.