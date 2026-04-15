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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      areas_atuacao: {
        Row: {
          bairros_ids: string[] | null
          created_at: string
          geometria: Json | null
          id: string
          municipio_id: string
          nome: string
          observacoes: string | null
          responsavel_id: string | null
          tipo: Database["public"]["Enums"]["tipo_area_atuacao"]
          updated_at: string
        }
        Insert: {
          bairros_ids?: string[] | null
          created_at?: string
          geometria?: Json | null
          id?: string
          municipio_id: string
          nome: string
          observacoes?: string | null
          responsavel_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_area_atuacao"]
          updated_at?: string
        }
        Update: {
          bairros_ids?: string[] | null
          created_at?: string
          geometria?: Json | null
          id?: string
          municipio_id?: string
          nome?: string
          observacoes?: string | null
          responsavel_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_area_atuacao"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_atuacao_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bairros: {
        Row: {
          classificacao:
            | Database["public"]["Enums"]["classificacao_territorial"]
            | null
          created_at: string
          distrito_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          municipio_id: string
          nome: string
          updated_at: string
        }
        Insert: {
          classificacao?:
            | Database["public"]["Enums"]["classificacao_territorial"]
            | null
          created_at?: string
          distrito_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipio_id: string
          nome: string
          updated_at?: string
        }
        Update: {
          classificacao?:
            | Database["public"]["Enums"]["classificacao_territorial"]
            | null
          created_at?: string
          distrito_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipio_id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bairros_distrito_id_fkey"
            columns: ["distrito_id"]
            isOneToOne: false
            referencedRelation: "distritos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bairros_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      comunidades: {
        Row: {
          bairro_id: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          microarea: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          bairro_id: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          microarea?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          bairro_id?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          microarea?: string | null
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunidades_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "bairros"
            referencedColumns: ["id"]
          },
        ]
      }
      distritos: {
        Row: {
          created_at: string
          geocodigo_ibge: string | null
          id: string
          municipio_id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          geocodigo_ibge?: string | null
          id?: string
          municipio_id: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          geocodigo_ibge?: string | null
          id?: string
          municipio_id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "distritos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      estados: {
        Row: {
          created_at: string
          geocodigo_ibge: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          sigla: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          geocodigo_ibge?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          sigla: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          geocodigo_ibge?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          sigla?: string
          updated_at?: string
        }
        Relationships: []
      }
      municipios: {
        Row: {
          created_at: string
          eleitorado_total: number | null
          estado_id: string
          geocodigo_ibge: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          populacao: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          eleitorado_total?: number | null
          estado_id: string
          geocodigo_ibge?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          populacao?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          eleitorado_total?: number | null
          estado_id?: string
          geocodigo_ibge?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          populacao?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipios_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      secoes_eleitorais: {
        Row: {
          created_at: string
          eleitores_aptos: number | null
          endereco: string | null
          id: string
          latitude: number | null
          local_votacao: string | null
          longitude: number | null
          numero_secao: number
          updated_at: string
          zona_id: string
        }
        Insert: {
          created_at?: string
          eleitores_aptos?: number | null
          endereco?: string | null
          id?: string
          latitude?: number | null
          local_votacao?: string | null
          longitude?: number | null
          numero_secao: number
          updated_at?: string
          zona_id: string
        }
        Update: {
          created_at?: string
          eleitores_aptos?: number | null
          endereco?: string | null
          id?: string
          latitude?: number | null
          local_votacao?: string | null
          longitude?: number | null
          numero_secao?: number
          updated_at?: string
          zona_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secoes_eleitorais_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas_eleitorais"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zonas_eleitorais: {
        Row: {
          created_at: string
          id: string
          municipio_id: string
          numero_zona: number
          tribunal_regional: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          municipio_id: string
          numero_zona: number
          tribunal_regional?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          municipio_id?: string
          numero_zona?: number
          tribunal_regional?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zonas_eleitorais_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_manage_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "coordenador"
        | "lideranca"
        | "operador"
        | "visualizador"
      classificacao_territorial:
        | "reduto"
        | "expansao"
        | "disputa"
        | "risco"
        | "baixa_presenca"
      tipo_area_atuacao: "equipe" | "lider" | "coordenador"
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
      app_role: [
        "admin",
        "coordenador",
        "lideranca",
        "operador",
        "visualizador",
      ],
      classificacao_territorial: [
        "reduto",
        "expansao",
        "disputa",
        "risco",
        "baixa_presenca",
      ],
      tipo_area_atuacao: ["equipe", "lider", "coordenador"],
    },
  },
} as const
