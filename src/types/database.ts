export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string | null
          id: string
          institution_id: string | null
          name: string
          type: Database["public"]["Enums"]["account_type_enum"]
          user_id: string
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          id?: string
          institution_id?: string | null
          name: string
          type: Database["public"]["Enums"]["account_type_enum"]
          user_id: string
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          id?: string
          institution_id?: string | null
          name?: string
          type?: Database["public"]["Enums"]["account_type_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "financial_institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_id: string
          overdraft_limit: number | null
        }
        Insert: {
          account_id: string
          overdraft_limit?: number | null
        }
        Update: {
          account_id?: string
          overdraft_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          id: string
          subcategory_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          subcategory_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          subcategory_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      card_installments: {
        Row: {
          amount: number
          competence: string
          created_at: string | null
          credit_card_id: string
          id: string
          purchase_id: string
        }
        Insert: {
          amount: number
          competence: string
          created_at?: string | null
          credit_card_id: string
          id?: string
          purchase_id: string
        }
        Update: {
          amount?: number
          competence?: string
          created_at?: string | null
          credit_card_id?: string
          id?: string
          purchase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_installments_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_installments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "card_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      card_payments: {
        Row: {
          account_id: string
          amount: number
          created_at: string | null
          credit_card_id: string
          id: string
          payment_date: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string | null
          credit_card_id: string
          id?: string
          payment_date: string
          transaction_id: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string | null
          credit_card_id?: string
          id?: string
          payment_date?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_payments_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      card_purchases: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          credit_card_id: string
          description: string | null
          id: string
          installments: number
          is_reservoir: boolean | null
          purchase_date: string
          subcategory_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          credit_card_id: string
          description?: string | null
          id?: string
          installments: number
          is_reservoir?: boolean | null
          purchase_date: string
          subcategory_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          credit_card_id?: string
          description?: string | null
          id?: string
          installments?: number
          is_reservoir?: boolean | null
          purchase_date?: string
          subcategory_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_purchases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_purchases_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_purchases_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_accounts: {
        Row: {
          account_id: string
          initial_balance: number | null
        }
        Insert: {
          account_id: string
          initial_balance?: number | null
        }
        Update: {
          account_id?: string
          initial_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean | null
          color: string
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          is_system: boolean | null
          name: string
          type: Database["public"]["Enums"]["category_type_enum"]
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          color: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_system?: boolean | null
          name: string
          type: Database["public"]["Enums"]["category_type_enum"]
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_system?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["category_type_enum"]
          user_id?: string | null
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          account_id: string
          closing_day: number
          due_day: number
        }
        Insert: {
          account_id: string
          closing_day: number
          due_day: number
        }
        Update: {
          account_id?: string
          closing_day?: number
          due_day?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          active: boolean | null
          agent: string
          created_at: string | null
          id: string
          initial_balance: number
          side: Database["public"]["Enums"]["debt_side_enum"]
          user_id: string
        }
        Insert: {
          active?: boolean | null
          agent: string
          created_at?: string | null
          id?: string
          initial_balance: number
          side: Database["public"]["Enums"]["debt_side_enum"]
          user_id: string
        }
        Update: {
          active?: boolean | null
          agent?: string
          created_at?: string | null
          id?: string
          initial_balance?: number
          side?: Database["public"]["Enums"]["debt_side_enum"]
          user_id?: string
        }
        Relationships: []
      }
      financial_institutions: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      fixed_expenses: {
        Row: {
          active: boolean | null
          amount: number
          category_id: string | null
          created_at: string | null
          default_account_id: string | null
          due_day: number
          id: string
          name: string
          subcategory_id: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          default_account_id?: string | null
          due_day: number
          id?: string
          name: string
          subcategory_id?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          default_account_id?: string | null
          due_day?: number
          id?: string
          name?: string
          subcategory_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_expenses_default_account_id_fkey"
            columns: ["default_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_expenses_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          name: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          name?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          name?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reservoir_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          linked_card_purchase_id: string | null
          linked_transaction_id: string | null
          reservoir_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          linked_card_purchase_id?: string | null
          linked_transaction_id?: string | null
          reservoir_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          linked_card_purchase_id?: string | null
          linked_transaction_id?: string | null
          reservoir_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservoir_transactions_linked_card_purchase_id_fkey"
            columns: ["linked_card_purchase_id"]
            isOneToOne: false
            referencedRelation: "card_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservoir_transactions_linked_transaction_id_fkey"
            columns: ["linked_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservoir_transactions_reservoir_id_fkey"
            columns: ["reservoir_id"]
            isOneToOne: false
            referencedRelation: "reservoirs"
            referencedColumns: ["id"]
          },
        ]
      }
      reservoirs: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          name: string
          subcategory_id: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          subcategory_id?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          subcategory_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservoirs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservoirs_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          active: boolean | null
          category_id: string
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          category_id: string
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          category_id?: string
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          date: string
          description: string | null
          destination_account_id: string | null
          id: string
          is_reservoir: boolean | null
          origin_account_id: string | null
          subcategory_id: string | null
          type: Database["public"]["Enums"]["transaction_type_enum"]
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          destination_account_id?: string | null
          id?: string
          is_reservoir?: boolean | null
          origin_account_id?: string | null
          subcategory_id?: string | null
          type: Database["public"]["Enums"]["transaction_type_enum"]
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          destination_account_id?: string | null
          id?: string
          is_reservoir?: boolean | null
          origin_account_id?: string | null
          subcategory_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_destination_account_id_fkey"
            columns: ["destination_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_origin_account_id_fkey"
            columns: ["origin_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_type_enum: "CASH" | "BANK" | "CREDIT_CARD"
      category_type_enum: "INCOME" | "EXPENSE"
      debt_side_enum: "PAYABLE" | "RECEIVABLE"
      transaction_type_enum:
        | "INCOME"
        | "EXPENSE"
        | "TRANSFER"
        | "CREDIT_CARD_PAYMENT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_type_enum: ["CASH", "BANK", "CREDIT_CARD"],
      category_type_enum: ["INCOME", "EXPENSE"],
      debt_side_enum: ["PAYABLE", "RECEIVABLE"],
      transaction_type_enum: [
        "INCOME",
        "EXPENSE",
        "TRANSFER",
        "CREDIT_CARD_PAYMENT",
      ],
    },
  },
} as const
