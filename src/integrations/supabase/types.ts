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
      agenda: {
        Row: {
          bairro_id: string | null
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          endereco: string | null
          id: string
          latitude: number | null
          local: string | null
          longitude: number | null
          municipio_id: string | null
          observacoes: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["status_agenda"]
          tipo: Database["public"]["Enums"]["tipo_agenda"]
          titulo: string
          updated_at: string
        }
        Insert: {
          bairro_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          endereco?: string | null
          id?: string
          latitude?: number | null
          local?: string | null
          longitude?: number | null
          municipio_id?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_agenda"]
          tipo: Database["public"]["Enums"]["tipo_agenda"]
          titulo: string
          updated_at?: string
        }
        Update: {
          bairro_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          endereco?: string | null
          id?: string
          latitude?: number | null
          local?: string | null
          longitude?: number | null
          municipio_id?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_agenda"]
          tipo?: Database["public"]["Enums"]["tipo_agenda"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "bairros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_checkins: {
        Row: {
          agenda_id: string
          created_at: string
          foto_url: string | null
          id: string
          latitude: number | null
          longitude: number | null
          tipo: Database["public"]["Enums"]["tipo_checkin"]
          usuario_id: string | null
        }
        Insert: {
          agenda_id: string
          created_at?: string
          foto_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          tipo: Database["public"]["Enums"]["tipo_checkin"]
          usuario_id?: string | null
        }
        Update: {
          agenda_id?: string
          created_at?: string
          foto_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          tipo?: Database["public"]["Enums"]["tipo_checkin"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_checkins_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agenda"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_followups: {
        Row: {
          agenda_id: string
          concluido: boolean
          created_at: string
          descricao: string
          id: string
          prazo: string | null
          responsavel_id: string | null
        }
        Insert: {
          agenda_id: string
          concluido?: boolean
          created_at?: string
          descricao: string
          id?: string
          prazo?: string | null
          responsavel_id?: string | null
        }
        Update: {
          agenda_id?: string
          concluido?: boolean
          created_at?: string
          descricao?: string
          id?: string
          prazo?: string | null
          responsavel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_followups_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agenda"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_participantes: {
        Row: {
          agenda_id: string
          confirmado: boolean
          created_at: string
          data_confirmacao: string | null
          id: string
          papel: Database["public"]["Enums"]["papel_participante"]
          pessoa_id: string
          presente: boolean
        }
        Insert: {
          agenda_id: string
          confirmado?: boolean
          created_at?: string
          data_confirmacao?: string | null
          id?: string
          papel?: Database["public"]["Enums"]["papel_participante"]
          pessoa_id: string
          presente?: boolean
        }
        Update: {
          agenda_id?: string
          confirmado?: boolean
          created_at?: string
          data_confirmacao?: string | null
          id?: string
          papel?: Database["public"]["Enums"]["papel_participante"]
          pessoa_id?: string
          presente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agenda_participantes_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agenda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_participantes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
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
      demandas: {
        Row: {
          bairro_id: string | null
          categoria: Database["public"]["Enums"]["categoria_demanda"]
          created_at: string
          created_by: string | null
          data_abertura: string
          data_prazo: string | null
          data_resolucao: string | null
          data_retorno_cidadao: string | null
          descricao: string | null
          id: string
          municipio_id: string | null
          origem: Database["public"]["Enums"]["origem_demanda"] | null
          pessoa_id: string | null
          prioridade: Database["public"]["Enums"]["prioridade_demanda"]
          protocolo: string
          resolucao_descricao: string | null
          responsavel_id: string | null
          satisfacao_cidadao: number | null
          status: Database["public"]["Enums"]["status_demanda"]
          titulo: string
          updated_at: string
        }
        Insert: {
          bairro_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_demanda"]
          created_at?: string
          created_by?: string | null
          data_abertura?: string
          data_prazo?: string | null
          data_resolucao?: string | null
          data_retorno_cidadao?: string | null
          descricao?: string | null
          id?: string
          municipio_id?: string | null
          origem?: Database["public"]["Enums"]["origem_demanda"] | null
          pessoa_id?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_demanda"]
          protocolo: string
          resolucao_descricao?: string | null
          responsavel_id?: string | null
          satisfacao_cidadao?: number | null
          status?: Database["public"]["Enums"]["status_demanda"]
          titulo: string
          updated_at?: string
        }
        Update: {
          bairro_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_demanda"]
          created_at?: string
          created_by?: string | null
          data_abertura?: string
          data_prazo?: string | null
          data_resolucao?: string | null
          data_retorno_cidadao?: string | null
          descricao?: string | null
          id?: string
          municipio_id?: string | null
          origem?: Database["public"]["Enums"]["origem_demanda"] | null
          pessoa_id?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_demanda"]
          protocolo?: string
          resolucao_descricao?: string | null
          responsavel_id?: string | null
          satisfacao_cidadao?: number | null
          status?: Database["public"]["Enums"]["status_demanda"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandas_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "bairros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas_anexos: {
        Row: {
          arquivo_url: string
          created_at: string
          demanda_id: string
          descricao: string | null
          id: string
          tipo: string | null
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          demanda_id: string
          descricao?: string | null
          id?: string
          tipo?: string | null
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          demanda_id?: string
          descricao?: string | null
          id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demandas_anexos_demanda_id_fkey"
            columns: ["demanda_id"]
            isOneToOne: false
            referencedRelation: "demandas"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas_encaminhamentos: {
        Row: {
          created_at: string
          de_usuario_id: string | null
          demanda_id: string
          id: string
          observacao: string | null
          para_usuario_id: string | null
        }
        Insert: {
          created_at?: string
          de_usuario_id?: string | null
          demanda_id: string
          id?: string
          observacao?: string | null
          para_usuario_id?: string | null
        }
        Update: {
          created_at?: string
          de_usuario_id?: string | null
          demanda_id?: string
          id?: string
          observacao?: string | null
          para_usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demandas_encaminhamentos_demanda_id_fkey"
            columns: ["demanda_id"]
            isOneToOne: false
            referencedRelation: "demandas"
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
      pessoas: {
        Row: {
          cpf: string | null
          created_at: string
          created_by: string | null
          data_nascimento: string | null
          escolaridade: string | null
          full_name: string
          genero: string | null
          id: string
          nivel_relacionamento: Database["public"]["Enums"]["nivel_relacionamento"]
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          data_nascimento?: string | null
          escolaridade?: string | null
          full_name: string
          genero?: string | null
          id?: string
          nivel_relacionamento?: Database["public"]["Enums"]["nivel_relacionamento"]
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          data_nascimento?: string | null
          escolaridade?: string | null
          full_name?: string
          genero?: string | null
          id?: string
          nivel_relacionamento?: Database["public"]["Enums"]["nivel_relacionamento"]
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pessoas_anexos: {
        Row: {
          arquivo_url: string
          created_at: string
          descricao: string | null
          id: string
          pessoa_id: string
          tipo_documento: string | null
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          descricao?: string | null
          id?: string
          pessoa_id: string
          tipo_documento?: string | null
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          descricao?: string | null
          id?: string
          pessoa_id?: string
          tipo_documento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_anexos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoas_consentimentos: {
        Row: {
          base_legal: string | null
          canal_coleta: string | null
          consentido: boolean
          created_at: string
          data_consentimento: string | null
          data_revogacao: string | null
          finalidade: Database["public"]["Enums"]["finalidade_lgpd"]
          id: string
          ip_coleta: string | null
          pessoa_id: string
        }
        Insert: {
          base_legal?: string | null
          canal_coleta?: string | null
          consentido?: boolean
          created_at?: string
          data_consentimento?: string | null
          data_revogacao?: string | null
          finalidade: Database["public"]["Enums"]["finalidade_lgpd"]
          id?: string
          ip_coleta?: string | null
          pessoa_id: string
        }
        Update: {
          base_legal?: string | null
          canal_coleta?: string | null
          consentido?: boolean
          created_at?: string
          data_consentimento?: string | null
          data_revogacao?: string | null
          finalidade?: Database["public"]["Enums"]["finalidade_lgpd"]
          id?: string
          ip_coleta?: string | null
          pessoa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_consentimentos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoas_contatos: {
        Row: {
          created_at: string
          id: string
          pessoa_id: string
          principal: boolean
          tipo: Database["public"]["Enums"]["tipo_contato"]
          valor: string
          verificado: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          pessoa_id: string
          principal?: boolean
          tipo: Database["public"]["Enums"]["tipo_contato"]
          valor: string
          verificado?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          pessoa_id?: string
          principal?: boolean
          tipo?: Database["public"]["Enums"]["tipo_contato"]
          valor?: string
          verificado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_contatos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoas_enderecos: {
        Row: {
          bairro_id: string | null
          cep: string | null
          complemento: string | null
          created_at: string
          id: string
          latitude: number | null
          logradouro: string | null
          longitude: number | null
          municipio_id: string | null
          numero: string | null
          pessoa_id: string
          tipo: Database["public"]["Enums"]["tipo_endereco"]
        }
        Insert: {
          bairro_id?: string | null
          cep?: string | null
          complemento?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          logradouro?: string | null
          longitude?: number | null
          municipio_id?: string | null
          numero?: string | null
          pessoa_id: string
          tipo?: Database["public"]["Enums"]["tipo_endereco"]
        }
        Update: {
          bairro_id?: string | null
          cep?: string | null
          complemento?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          logradouro?: string | null
          longitude?: number | null
          municipio_id?: string | null
          numero?: string | null
          pessoa_id?: string
          tipo?: Database["public"]["Enums"]["tipo_endereco"]
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_enderecos_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "bairros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pessoas_enderecos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pessoas_enderecos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoas_historico_contatos: {
        Row: {
          created_at: string
          data_contato: string
          id: string
          pessoa_id: string
          proximo_contato: string | null
          responsavel_id: string | null
          resultado: string | null
          resumo: string | null
          tipo: Database["public"]["Enums"]["tipo_interacao"]
        }
        Insert: {
          created_at?: string
          data_contato?: string
          id?: string
          pessoa_id: string
          proximo_contato?: string | null
          responsavel_id?: string | null
          resultado?: string | null
          resumo?: string | null
          tipo: Database["public"]["Enums"]["tipo_interacao"]
        }
        Update: {
          created_at?: string
          data_contato?: string
          id?: string
          pessoa_id?: string
          proximo_contato?: string | null
          responsavel_id?: string | null
          resultado?: string | null
          resumo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_interacao"]
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_historico_contatos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoas_papeis: {
        Row: {
          ativo: boolean
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          observacoes: string | null
          papel: Database["public"]["Enums"]["papel_pessoa"]
          pessoa_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          observacoes?: string | null
          papel: Database["public"]["Enums"]["papel_pessoa"]
          pessoa_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          observacoes?: string | null
          papel?: Database["public"]["Enums"]["papel_pessoa"]
          pessoa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_papeis_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoas_tags: {
        Row: {
          created_at: string
          id: string
          pessoa_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pessoa_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pessoa_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_tags_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pessoas_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoas_vinculos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          pessoa_id: string
          pessoa_vinculada_id: string
          tipo_vinculo: Database["public"]["Enums"]["tipo_vinculo"]
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          pessoa_id: string
          pessoa_vinculada_id: string
          tipo_vinculo: Database["public"]["Enums"]["tipo_vinculo"]
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          pessoa_id?: string
          pessoa_vinculada_id?: string
          tipo_vinculo?: Database["public"]["Enums"]["tipo_vinculo"]
        }
        Relationships: [
          {
            foreignKeyName: "pessoas_vinculos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pessoas_vinculos_pessoa_vinculada_id_fkey"
            columns: ["pessoa_vinculada_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
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
      tags: {
        Row: {
          categoria: string | null
          cor: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          categoria?: string | null
          cor?: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          categoria?: string | null
          cor?: string
          created_at?: string
          id?: string
          nome?: string
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
      categoria_demanda:
        | "saude"
        | "educacao"
        | "infraestrutura"
        | "seguranca"
        | "social"
        | "emprego"
        | "moradia"
        | "transporte"
        | "outros"
      classificacao_territorial:
        | "reduto"
        | "expansao"
        | "disputa"
        | "risco"
        | "baixa_presenca"
      finalidade_lgpd:
        | "comunicacao_politica"
        | "pesquisa"
        | "campanha"
        | "mandato"
      nivel_relacionamento:
        | "desconhecido"
        | "frio"
        | "morno"
        | "quente"
        | "aliado"
        | "lideranca"
      origem_demanda:
        | "visita"
        | "telefone"
        | "whatsapp"
        | "gabinete"
        | "evento"
        | "rede_social"
      papel_participante: "organizador" | "palestrante" | "convidado" | "equipe"
      papel_pessoa:
        | "eleitor"
        | "apoiador"
        | "lideranca"
        | "coordenador_bairro"
        | "doador"
        | "fornecedor"
        | "imprensa"
        | "institucional"
        | "demandante"
        | "equipe"
      prioridade_demanda: "baixa" | "media" | "alta" | "urgente"
      status_agenda:
        | "planejado"
        | "confirmado"
        | "em_andamento"
        | "realizado"
        | "cancelado"
      status_demanda:
        | "aberta"
        | "triagem"
        | "encaminhada"
        | "em_andamento"
        | "resolvida"
        | "arquivada"
      tipo_agenda:
        | "visita"
        | "evento"
        | "reuniao"
        | "comicio"
        | "carreata"
        | "porta_a_porta"
        | "audiencia"
        | "retorno"
      tipo_area_atuacao: "equipe" | "lider" | "coordenador"
      tipo_checkin: "checkin" | "checkout"
      tipo_contato:
        | "celular"
        | "fixo"
        | "whatsapp"
        | "email"
        | "instagram"
        | "facebook"
        | "twitter"
      tipo_endereco: "residencial" | "comercial" | "referencia"
      tipo_interacao:
        | "ligacao"
        | "visita"
        | "whatsapp"
        | "email"
        | "reuniao"
        | "evento"
      tipo_vinculo:
        | "familiar"
        | "comunitario"
        | "profissional"
        | "politico"
        | "indicacao"
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
      categoria_demanda: [
        "saude",
        "educacao",
        "infraestrutura",
        "seguranca",
        "social",
        "emprego",
        "moradia",
        "transporte",
        "outros",
      ],
      classificacao_territorial: [
        "reduto",
        "expansao",
        "disputa",
        "risco",
        "baixa_presenca",
      ],
      finalidade_lgpd: [
        "comunicacao_politica",
        "pesquisa",
        "campanha",
        "mandato",
      ],
      nivel_relacionamento: [
        "desconhecido",
        "frio",
        "morno",
        "quente",
        "aliado",
        "lideranca",
      ],
      origem_demanda: [
        "visita",
        "telefone",
        "whatsapp",
        "gabinete",
        "evento",
        "rede_social",
      ],
      papel_participante: ["organizador", "palestrante", "convidado", "equipe"],
      papel_pessoa: [
        "eleitor",
        "apoiador",
        "lideranca",
        "coordenador_bairro",
        "doador",
        "fornecedor",
        "imprensa",
        "institucional",
        "demandante",
        "equipe",
      ],
      prioridade_demanda: ["baixa", "media", "alta", "urgente"],
      status_agenda: [
        "planejado",
        "confirmado",
        "em_andamento",
        "realizado",
        "cancelado",
      ],
      status_demanda: [
        "aberta",
        "triagem",
        "encaminhada",
        "em_andamento",
        "resolvida",
        "arquivada",
      ],
      tipo_agenda: [
        "visita",
        "evento",
        "reuniao",
        "comicio",
        "carreata",
        "porta_a_porta",
        "audiencia",
        "retorno",
      ],
      tipo_area_atuacao: ["equipe", "lider", "coordenador"],
      tipo_checkin: ["checkin", "checkout"],
      tipo_contato: [
        "celular",
        "fixo",
        "whatsapp",
        "email",
        "instagram",
        "facebook",
        "twitter",
      ],
      tipo_endereco: ["residencial", "comercial", "referencia"],
      tipo_interacao: [
        "ligacao",
        "visita",
        "whatsapp",
        "email",
        "reuniao",
        "evento",
      ],
      tipo_vinculo: [
        "familiar",
        "comunitario",
        "profissional",
        "politico",
        "indicacao",
      ],
    },
  },
} as const
