-- ============================================================
-- MyFinance — Schema inicial (todas as tabelas + RLS + price_history)
-- ============================================================

-- ─── Profiles ──────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  moeda_base text default 'BRL',
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "users select own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- trigger para criar profile automaticamente ao criar usuário
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Accounts (contas) ────────────────────────────────────
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  tipo text not null check (tipo in ('corrente','poupanca','corretora','carteira_cripto','exchange_cripto')),
  instituicao text,
  moeda text default 'BRL',
  liquida boolean default true,
  created_at timestamp with time zone default now()
);

alter table public.accounts enable row level security;

create policy "accounts access" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Categories (categorias) ──────────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  tipo text not null check (tipo in ('receita','despesa')),
  cor text,
  icone text
);

alter table public.categories enable row level security;

create policy "categories access" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Recurring Transactions (assinaturas/faturas) ─────────
create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  valor numeric not null,
  moeda text default 'BRL',
  dia_vencimento integer not null,
  frequencia text not null check (frequencia in ('mensal','anual')),
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  ativo boolean default true,
  proxima_data date
);

alter table public.recurring_transactions enable row level security;

create policy "recurring_transactions access" on public.recurring_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Transactions (fiat) ──────────────────────────────────
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  tipo text not null check (tipo in ('receita','despesa','transferencia')),
  valor numeric not null,
  moeda text default 'BRL',
  data date not null,
  descricao text,
  tags text[],
  recorrente boolean default false,
  recurring_id uuid references public.recurring_transactions(id) on delete set null
);

alter table public.transactions enable row level security;

create policy "transactions access" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Investments (tradicionais) ───────────────────────────
create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  account_id uuid references public.accounts(id) on delete set null,
  tipo_ativo text not null check (tipo_ativo in ('renda_fixa','acao','fundo','fii')),
  nome text not null,
  quantidade numeric not null,
  preco_medio numeric not null,
  preco_atual numeric,
  moeda text default 'BRL',
  atualizado_em timestamp with time zone default now()
);

alter table public.investments enable row level security;

create policy "investments access" on public.investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Crypto Wallets ───────────────────────────────────────
create table public.crypto_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  tipo text not null check (tipo in ('exchange','wallet_propria','cold_wallet')),
  observacao text
);

alter table public.crypto_wallets enable row level security;

create policy "crypto_wallets access" on public.crypto_wallets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Crypto Holdings ──────────────────────────────────────
create table public.crypto_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  wallet_id uuid references public.crypto_wallets(id) on delete cascade,
  simbolo text not null,
  quantidade numeric not null default 0,
  preco_medio_brl numeric,
  preco_atual_usd numeric,
  preco_atual_brl numeric,
  atualizado_em timestamp with time zone default now()
);

alter table public.crypto_holdings enable row level security;

create policy "crypto_holdings access" on public.crypto_holdings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Crypto Transactions ──────────────────────────────────
create table public.crypto_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  wallet_id uuid references public.crypto_wallets(id) on delete cascade,
  simbolo text not null,
  tipo text not null check (tipo in ('compra','venda','transferencia','stake','unstake','swap','airdrop','taxa')),
  quantidade numeric not null,
  preco_unitario numeric,
  taxa numeric default 0,
  data timestamp with time zone default now(),
  notas text
);

alter table public.crypto_transactions enable row level security;

create policy "crypto_transactions access" on public.crypto_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Debts ────────────────────────────────────────────────
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  tipo text not null check (tipo in ('emprestimo','cartao','financiamento')),
  valor_total numeric not null,
  valor_restante numeric not null,
  taxa_juros numeric,
  parcela_mensal numeric,
  vencimento date
);

alter table public.debts enable row level security;

create policy "debts access" on public.debts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Fixed Assets ─────────────────────────────────────────
create table public.fixed_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  categoria text not null check (categoria in ('imovel','veiculo','outro')),
  valor_estimado numeric,
  valor_compra numeric,
  data_compra date
);

alter table public.fixed_assets enable row level security;

create policy "fixed_assets access" on public.fixed_assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Goals ────────────────────────────────────────────────
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  valor_alvo numeric not null,
  valor_atual numeric default 0,
  data_alvo date,
  prioridade integer default 0
);

alter table public.goals enable row level security;

create policy "goals access" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Price Cache ──────────────────────────────────────────
create table public.price_cache (
  simbolo text primary key,
  preco_usd numeric,
  preco_brl numeric,
  atualizado_em timestamp with time zone default now()
);

-- acesso público (dados de mercado, não dados pessoais)
alter table public.price_cache enable row level security;

create policy "price_cache read for all authenticated"
  on public.price_cache for select
  using (auth.role() = 'authenticated');

-- ─── Price History (novo — snapshots para gráfico de evolução) ───
create table public.price_history (
  id bigint primary key generated always as identity,
  simbolo text not null,
  preco_usd numeric not null,
  preco_brl numeric not null,
  timestamp timestamp with time zone default now()
);

alter table public.price_history enable row level security;

create policy "price_history read for all authenticated"
  on public.price_history for select
  using (auth.role() = 'authenticated');

-- índice para consultas por símbolo ordenadas por data
create index idx_price_history_simbolo_ts
  on public.price_history (simbolo, timestamp desc);

-- ─── Exchange Rates ───────────────────────────────────────
create table public.exchange_rates (
  par text primary key,
  taxa numeric,
  atualizado_em timestamp with time zone default now()
);

alter table public.exchange_rates enable row level security;

create policy "exchange_rates read for all authenticated"
  on public.exchange_rates for select
  using (auth.role() = 'authenticated');
