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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alertas: {
        Row: {
          created_at: string
          data_vencimento: string | null
          dias_para_vencer: number | null
          exame_funcionario_id: string | null
          exame_ocupacional_id: string | null
          funcionario_id: string | null
          id: string
          mensagem: string | null
          nivel: string
          resolvido: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_vencimento?: string | null
          dias_para_vencer?: number | null
          exame_funcionario_id?: string | null
          exame_ocupacional_id?: string | null
          funcionario_id?: string | null
          id?: string
          mensagem?: string | null
          nivel?: string
          resolvido?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_vencimento?: string | null
          dias_para_vencer?: number | null
          exame_funcionario_id?: string | null
          exame_ocupacional_id?: string | null
          funcionario_id?: string | null
          id?: string
          mensagem?: string | null
          nivel?: string
          resolvido?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_exame_funcionario_id_fkey"
            columns: ["exame_funcionario_id"]
            isOneToOne: false
            referencedRelation: "exames_funcionario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_exame_ocupacional_id_fkey"
            columns: ["exame_ocupacional_id"]
            isOneToOne: false
            referencedRelation: "exames_ocupacionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      asos: {
        Row: {
          aptidao: string
          created_at: string
          crm_medico: string | null
          data_emissao: string
          funcionario_id: string
          id: string
          medico_responsavel: string | null
          proximo_aso: string | null
          restricoes: string | null
          tipo_exame: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aptidao?: string
          created_at?: string
          crm_medico?: string | null
          data_emissao?: string
          funcionario_id: string
          id?: string
          medico_responsavel?: string | null
          proximo_aso?: string | null
          restricoes?: string | null
          tipo_exame?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aptidao?: string
          created_at?: string
          crm_medico?: string | null
          data_emissao?: string
          funcionario_id?: string
          id?: string
          medico_responsavel?: string | null
          proximo_aso?: string | null
          restricoes?: string | null
          tipo_exame?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          acao: string
          created_at: string
          dados_antes: Json | null
          dados_depois: Json | null
          id: string
          registro_id: string | null
          tabela: string
          user_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          registro_id?: string | null
          tabela: string
          user_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          registro_id?: string | null
          tabela?: string
          user_id?: string
        }
        Relationships: []
      }
      cargo_riscos: {
        Row: {
          cargo_id: string
          created_at: string
          id: string
          risco_id: string
          user_id: string
        }
        Insert: {
          cargo_id: string
          created_at?: string
          id?: string
          risco_id: string
          user_id: string
        }
        Update: {
          cargo_id?: string
          created_at?: string
          id?: string
          risco_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cargo_riscos_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargo_riscos_risco_id_fkey"
            columns: ["risco_id"]
            isOneToOne: false
            referencedRelation: "riscos_ocupacionais"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      epi_atribuicoes: {
        Row: {
          created_at: string
          data_entrega: string
          epi_id: string
          funcionario_id: string
          id: string
          user_id: string
          validade: string
        }
        Insert: {
          created_at?: string
          data_entrega?: string
          epi_id: string
          funcionario_id: string
          id?: string
          user_id: string
          validade: string
        }
        Update: {
          created_at?: string
          data_entrega?: string
          epi_id?: string
          funcionario_id?: string
          id?: string
          user_id?: string
          validade?: string
        }
        Relationships: [
          {
            foreignKeyName: "epi_atribuicoes_epi_id_fkey"
            columns: ["epi_id"]
            isOneToOne: false
            referencedRelation: "epis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_atribuicoes_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      epis: {
        Row: {
          ca: string
          created_at: string
          entrega: string
          fabricante: string
          id: string
          nome: string
          tipo: string
          updated_at: string
          user_id: string
          uso: string
          validade: string
        }
        Insert: {
          ca: string
          created_at?: string
          entrega?: string
          fabricante?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
          user_id: string
          uso?: string
          validade: string
        }
        Update: {
          ca?: string
          created_at?: string
          entrega?: string
          fabricante?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          uso?: string
          validade?: string
        }
        Relationships: []
      }
      exames_funcionario: {
        Row: {
          created_at: string
          crm_medico: string | null
          data_realizacao: string | null
          data_vencimento: string | null
          exame_id: string
          funcionario_id: string
          id: string
          medico_responsavel: string | null
          observacoes: string | null
          resultado: string | null
          situacao: string
          tipo_exame: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          crm_medico?: string | null
          data_realizacao?: string | null
          data_vencimento?: string | null
          exame_id: string
          funcionario_id: string
          id?: string
          medico_responsavel?: string | null
          observacoes?: string | null
          resultado?: string | null
          situacao?: string
          tipo_exame?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          crm_medico?: string | null
          data_realizacao?: string | null
          data_vencimento?: string | null
          exame_id?: string
          funcionario_id?: string
          id?: string
          medico_responsavel?: string | null
          observacoes?: string | null
          resultado?: string | null
          situacao?: string
          tipo_exame?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exames_funcionario_exame_id_fkey"
            columns: ["exame_id"]
            isOneToOne: false
            referencedRelation: "exames_ocupacionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exames_funcionario_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      exames_ocupacionais: {
        Row: {
          created_at: string
          id: string
          nome: string
          periodicidade_meses: number
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          periodicidade_meses?: number
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          periodicidade_meses?: number
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      formularios_seguranca: {
        Row: {
          assinatura_responsavel_equipe: string | null
          assinatura_responsavel_site: string | null
          assinatura_tecnico_seguranca: string | null
          atividades: string[]
          created_at: string
          email: string
          empresa: string
          epis_sugeridos: string[]
          hora_fim: string
          hora_inicio: string
          id: string
          local: string
          medidas_controle: string[]
          nome: string
          outras_atividades: string | null
          ptp: string
          riscos: string[]
          setor: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assinatura_responsavel_equipe?: string | null
          assinatura_responsavel_site?: string | null
          assinatura_tecnico_seguranca?: string | null
          atividades?: string[]
          created_at?: string
          email: string
          empresa: string
          epis_sugeridos?: string[]
          hora_fim: string
          hora_inicio: string
          id?: string
          local: string
          medidas_controle?: string[]
          nome: string
          outras_atividades?: string | null
          ptp: string
          riscos?: string[]
          setor: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assinatura_responsavel_equipe?: string | null
          assinatura_responsavel_site?: string | null
          assinatura_tecnico_seguranca?: string | null
          atividades?: string[]
          created_at?: string
          email?: string
          empresa?: string
          epis_sugeridos?: string[]
          hora_fim?: string
          hora_inicio?: string
          id?: string
          local?: string
          medidas_controle?: string[]
          nome?: string
          outras_atividades?: string | null
          ptp?: string
          riscos?: string[]
          setor?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          cargo: string
          cargo_id: string | null
          cpf: string
          created_at: string
          data_admissao: string | null
          id: string
          nome: string
          setor: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cargo: string
          cargo_id?: string | null
          cpf: string
          created_at?: string
          data_admissao?: string | null
          id?: string
          nome: string
          setor: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cargo?: string
          cargo_id?: string | null
          cpf?: string
          created_at?: string
          data_admissao?: string | null
          id?: string
          nome?: string
          setor?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cnpj: string | null
          created_at: string
          data_fundacao: string | null
          endereco: string | null
          id: string
          ramo_atividade: string | null
          razao_social: string | null
          responsavel: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          data_fundacao?: string | null
          endereco?: string | null
          id?: string
          ramo_atividade?: string | null
          razao_social?: string | null
          responsavel?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          data_fundacao?: string | null
          endereco?: string | null
          id?: string
          ramo_atividade?: string | null
          razao_social?: string | null
          responsavel?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      risco_exames: {
        Row: {
          created_at: string
          exame_id: string
          id: string
          risco_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exame_id: string
          id?: string
          risco_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          exame_id?: string
          id?: string
          risco_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risco_exames_exame_id_fkey"
            columns: ["exame_id"]
            isOneToOne: false
            referencedRelation: "exames_ocupacionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risco_exames_risco_id_fkey"
            columns: ["risco_id"]
            isOneToOne: false
            referencedRelation: "riscos_ocupacionais"
            referencedColumns: ["id"]
          },
        ]
      }
      riscos_ocupacionais: {
        Row: {
          created_at: string
          descricao: string
          id: string
          nivel: string
          tipo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          nivel?: string
          tipo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          nivel?: string
          tipo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_admin: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_admin?: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_admin?: boolean | null
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string | null
          id: string
          read_by_admin: boolean
          status: string | null
          subject: string
          updated_at: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          read_by_admin?: boolean
          status?: string | null
          subject: string
          updated_at?: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          read_by_admin?: boolean
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
