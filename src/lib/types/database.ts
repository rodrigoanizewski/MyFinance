export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          tipo: "corrente" | "poupanca" | "corretora" | "carteira_cripto" | "exchange_cripto";
          instituicao: string | null;
          moeda: string;
          liquida: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          tipo: "corrente" | "poupanca" | "corretora" | "carteira_cripto" | "exchange_cripto";
          instituicao?: string | null;
          moeda?: string;
          liquida?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          tipo?: "corrente" | "poupanca" | "corretora" | "carteira_cripto" | "exchange_cripto";
          instituicao?: string | null;
          moeda?: string;
          liquida?: boolean;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          tipo: "receita" | "despesa";
          cor: string | null;
          icone: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          tipo: "receita" | "despesa";
          cor?: string | null;
          icone?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          tipo?: "receita" | "despesa";
          cor?: string | null;
          icone?: string | null;
        };
      };
      crypto_holdings: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string;
          simbolo: string;
          quantidade: number;
          preco_medio_brl: number | null;
          preco_atual_usd: number | null;
          preco_atual_brl: number | null;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_id: string;
          simbolo: string;
          quantidade?: number;
          preco_medio_brl?: number | null;
          preco_atual_usd?: number | null;
          preco_atual_brl?: number | null;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_id?: string;
          simbolo?: string;
          quantidade?: number;
          preco_medio_brl?: number | null;
          preco_atual_usd?: number | null;
          preco_atual_brl?: number | null;
          atualizado_em?: string;
        };
      };
      crypto_transactions: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string;
          simbolo: string;
          tipo: "compra" | "venda" | "transferencia" | "stake" | "unstake" | "swap" | "airdrop" | "taxa";
          quantidade: number;
          preco_unitario: number | null;
          taxa: number;
          data: string;
          notas: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_id: string;
          simbolo: string;
          tipo: "compra" | "venda" | "transferencia" | "stake" | "unstake" | "swap" | "airdrop" | "taxa";
          quantidade: number;
          preco_unitario?: number | null;
          taxa?: number;
          data?: string;
          notas?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_id?: string;
          simbolo?: string;
          tipo?: "compra" | "venda" | "transferencia" | "stake" | "unstake" | "swap" | "airdrop" | "taxa";
          quantidade?: number;
          preco_unitario?: number | null;
          taxa?: number;
          data?: string;
          notas?: string | null;
        };
      };
      crypto_wallets: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          tipo: "exchange" | "wallet_propria" | "cold_wallet";
          observacao: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          tipo: "exchange" | "wallet_propria" | "cold_wallet";
          observacao?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          tipo?: "exchange" | "wallet_propria" | "cold_wallet";
          observacao?: string | null;
        };
      };
      debts: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          tipo: "emprestimo" | "cartao" | "financiamento";
          valor_total: number;
          valor_restante: number;
          taxa_juros: number | null;
          parcela_mensal: number | null;
          vencimento: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          tipo: "emprestimo" | "cartao" | "financiamento";
          valor_total: number;
          valor_restante: number;
          taxa_juros?: number | null;
          parcela_mensal?: number | null;
          vencimento?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          tipo?: "emprestimo" | "cartao" | "financiamento";
          valor_total?: number;
          valor_restante?: number;
          taxa_juros?: number | null;
          parcela_mensal?: number | null;
          vencimento?: string | null;
        };
      };
      exchange_rates: {
        Row: {
          par: string;
          taxa: number | null;
          atualizado_em: string;
        };
        Insert: {
          par: string;
          taxa?: number | null;
          atualizado_em?: string;
        };
        Update: {
          par?: string;
          taxa?: number | null;
          atualizado_em?: string;
        };
      };
      fixed_assets: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          categoria: "imovel" | "veiculo" | "outro";
          valor_estimado: number | null;
          valor_compra: number | null;
          data_compra: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          categoria: "imovel" | "veiculo" | "outro";
          valor_estimado?: number | null;
          valor_compra?: number | null;
          data_compra?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          categoria?: "imovel" | "veiculo" | "outro";
          valor_estimado?: number | null;
          valor_compra?: number | null;
          data_compra?: string | null;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          valor_alvo: number;
          valor_atual: number;
          data_alvo: string | null;
          prioridade: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          valor_alvo: number;
          valor_atual?: number;
          data_alvo?: string | null;
          prioridade?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          valor_alvo?: number;
          valor_atual?: number;
          data_alvo?: string | null;
          prioridade?: number;
        };
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          tipo_ativo: "renda_fixa" | "acao" | "fundo" | "fii";
          nome: string;
          quantidade: number;
          preco_medio: number;
          preco_atual: number | null;
          moeda: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          tipo_ativo: "renda_fixa" | "acao" | "fundo" | "fii";
          nome: string;
          quantidade: number;
          preco_medio: number;
          preco_atual?: number | null;
          moeda?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string | null;
          tipo_ativo?: "renda_fixa" | "acao" | "fundo" | "fii";
          nome?: string;
          quantidade?: number;
          preco_medio?: number;
          preco_atual?: number | null;
          moeda?: string;
          atualizado_em?: string;
        };
      };
      price_cache: {
        Row: {
          simbolo: string;
          preco_usd: number | null;
          preco_brl: number | null;
          atualizado_em: string;
        };
        Insert: {
          simbolo: string;
          preco_usd?: number | null;
          preco_brl?: number | null;
          atualizado_em?: string;
        };
        Update: {
          simbolo?: string;
          preco_usd?: number | null;
          preco_brl?: number | null;
          atualizado_em?: string;
        };
      };
      price_history: {
        Row: {
          id: number;
          simbolo: string;
          preco_usd: number;
          preco_brl: number;
          timestamp: string;
        };
        Insert: {
          id?: never;
          simbolo: string;
          preco_usd: number;
          preco_brl: number;
          timestamp?: string;
        };
        Update: {
          id?: never;
          simbolo?: string;
          preco_usd?: number;
          preco_brl?: number;
          timestamp?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          nome: string | null;
          moeda_base: string;
          created_at: string;
        };
        Insert: {
          id: string;
          nome?: string | null;
          moeda_base?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string | null;
          moeda_base?: string;
          created_at?: string;
        };
      };
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          valor: number;
          moeda: string;
          dia_vencimento: number;
          frequencia: "mensal" | "anual";
          category_id: string | null;
          account_id: string | null;
          ativo: boolean;
          proxima_data: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          valor: number;
          moeda?: string;
          dia_vencimento: number;
          frequencia: "mensal" | "anual";
          category_id?: string | null;
          account_id?: string | null;
          ativo?: boolean;
          proxima_data?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          valor?: number;
          moeda?: string;
          dia_vencimento?: number;
          frequencia?: "mensal" | "anual";
          category_id?: string | null;
          account_id?: string | null;
          ativo?: boolean;
          proxima_data?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          category_id: string | null;
          tipo: "receita" | "despesa" | "transferencia";
          valor: number;
          moeda: string;
          data: string;
          descricao: string | null;
          tags: string[] | null;
          recorrente: boolean;
          recurring_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          category_id?: string | null;
          tipo: "receita" | "despesa" | "transferencia";
          valor: number;
          moeda?: string;
          data: string;
          descricao?: string | null;
          tags?: string[] | null;
          recorrente?: boolean;
          recurring_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string | null;
          category_id?: string | null;
          tipo?: "receita" | "despesa" | "transferencia";
          valor?: number;
          moeda?: string;
          data?: string;
          descricao?: string | null;
          tags?: string[] | null;
          recorrente?: boolean;
          recurring_id?: string | null;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
