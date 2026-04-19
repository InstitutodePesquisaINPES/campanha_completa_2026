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
            foreignKeyName: "agenda_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["bairro_id"]
          },
          {
            foreignKeyName: "agenda_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "v_lacunas_territoriais"
            referencedColumns: ["bairro_id"]
          },
          {
            foreignKeyName: "agenda_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
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
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
          },
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
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
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
      campanha_fases: {
        Row: {
          campanha_id: string
          created_at: string
          data_fim: string
          data_inicio: string
          fase: Database["public"]["Enums"]["fase_campanha"]
          foco: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          campanha_id: string
          created_at?: string
          data_fim: string
          data_inicio: string
          fase: Database["public"]["Enums"]["fase_campanha"]
          foco?: string | null
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          campanha_id?: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          fase?: Database["public"]["Enums"]["fase_campanha"]
          foco?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "campanha_fases_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_fases_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_campanha"
            referencedColumns: ["campanha_id"]
          },
        ]
      }
      campanha_metas: {
        Row: {
          area: Database["public"]["Enums"]["area_campanha"]
          campanha_id: string
          created_at: string
          fase: Database["public"]["Enums"]["fase_campanha"]
          id: string
          indicador: string
          meta: string
          observacoes: string | null
          ordem: number
          updated_at: string
          valor_meta: number
          valor_realizado: number
        }
        Insert: {
          area: Database["public"]["Enums"]["area_campanha"]
          campanha_id: string
          created_at?: string
          fase: Database["public"]["Enums"]["fase_campanha"]
          id?: string
          indicador: string
          meta: string
          observacoes?: string | null
          ordem?: number
          updated_at?: string
          valor_meta?: number
          valor_realizado?: number
        }
        Update: {
          area?: Database["public"]["Enums"]["area_campanha"]
          campanha_id?: string
          created_at?: string
          fase?: Database["public"]["Enums"]["fase_campanha"]
          id?: string
          indicador?: string
          meta?: string
          observacoes?: string | null
          ordem?: number
          updated_at?: string
          valor_meta?: number
          valor_realizado?: number
        }
        Relationships: [
          {
            foreignKeyName: "campanha_metas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_metas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_campanha"
            referencedColumns: ["campanha_id"]
          },
        ]
      }
      campanha_parametros: {
        Row: {
          campanha_id: string
          created_at: string
          custo_por_voto_reais: number
          escala_deputado_estadual: number
          escala_deputado_federal: number
          escala_governador: number
          escala_prefeito: number
          escala_presidente: number
          escala_senador: number
          escala_vereador: number
          escala_vice_governador: number
          escala_vice_prefeito: number
          id: string
          min_cadastro: number
          min_fiscais: number
          min_orcamento_reais: number
          min_visitas: number
          min_visitas_semana: number
          pct_cadastro_sobre_votos: number
          pct_visitas_sobre_votos: number
          preservar_concluidas: boolean
          tarefas_executivo: Json
          tarefas_legislativo: Json
          tarefas_municipio_foco: Json
          tse_debates_ativo: boolean
          tse_debates_dias: number
          tse_hgpe_ativo: boolean
          tse_hgpe_dias: number
          tse_prestacao_ativo: boolean
          tse_prestacao_dias: number
          tse_propaganda_ativo: boolean
          tse_propaganda_dias: number
          tse_registro_ativo: boolean
          tse_registro_dias: number
          updated_at: string
          votos_por_fiscal: number
        }
        Insert: {
          campanha_id: string
          created_at?: string
          custo_por_voto_reais?: number
          escala_deputado_estadual?: number
          escala_deputado_federal?: number
          escala_governador?: number
          escala_prefeito?: number
          escala_presidente?: number
          escala_senador?: number
          escala_vereador?: number
          escala_vice_governador?: number
          escala_vice_prefeito?: number
          id?: string
          min_cadastro?: number
          min_fiscais?: number
          min_orcamento_reais?: number
          min_visitas?: number
          min_visitas_semana?: number
          pct_cadastro_sobre_votos?: number
          pct_visitas_sobre_votos?: number
          preservar_concluidas?: boolean
          tarefas_executivo?: Json
          tarefas_legislativo?: Json
          tarefas_municipio_foco?: Json
          tse_debates_ativo?: boolean
          tse_debates_dias?: number
          tse_hgpe_ativo?: boolean
          tse_hgpe_dias?: number
          tse_prestacao_ativo?: boolean
          tse_prestacao_dias?: number
          tse_propaganda_ativo?: boolean
          tse_propaganda_dias?: number
          tse_registro_ativo?: boolean
          tse_registro_dias?: number
          updated_at?: string
          votos_por_fiscal?: number
        }
        Update: {
          campanha_id?: string
          created_at?: string
          custo_por_voto_reais?: number
          escala_deputado_estadual?: number
          escala_deputado_federal?: number
          escala_governador?: number
          escala_prefeito?: number
          escala_presidente?: number
          escala_senador?: number
          escala_vereador?: number
          escala_vice_governador?: number
          escala_vice_prefeito?: number
          id?: string
          min_cadastro?: number
          min_fiscais?: number
          min_orcamento_reais?: number
          min_visitas?: number
          min_visitas_semana?: number
          pct_cadastro_sobre_votos?: number
          pct_visitas_sobre_votos?: number
          preservar_concluidas?: boolean
          tarefas_executivo?: Json
          tarefas_legislativo?: Json
          tarefas_municipio_foco?: Json
          tse_debates_ativo?: boolean
          tse_debates_dias?: number
          tse_hgpe_ativo?: boolean
          tse_hgpe_dias?: number
          tse_prestacao_ativo?: boolean
          tse_prestacao_dias?: number
          tse_propaganda_ativo?: boolean
          tse_propaganda_dias?: number
          tse_registro_ativo?: boolean
          tse_registro_dias?: number
          updated_at?: string
          votos_por_fiscal?: number
        }
        Relationships: [
          {
            foreignKeyName: "campanha_parametros_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: true
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_parametros_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: true
            referencedRelation: "v_indicadores_campanha"
            referencedColumns: ["campanha_id"]
          },
        ]
      }
      campanha_semanas: {
        Row: {
          campanha_id: string
          created_at: string
          data_fim: string
          data_inicio: string
          fase: Database["public"]["Enums"]["fase_campanha"]
          foco_principal: string | null
          id: string
          meta_campo: string | null
          meta_digital: string | null
          meta_financeiro: string | null
          numero_semana: number
          observacoes: string | null
        }
        Insert: {
          campanha_id: string
          created_at?: string
          data_fim: string
          data_inicio: string
          fase: Database["public"]["Enums"]["fase_campanha"]
          foco_principal?: string | null
          id?: string
          meta_campo?: string | null
          meta_digital?: string | null
          meta_financeiro?: string | null
          numero_semana: number
          observacoes?: string | null
        }
        Update: {
          campanha_id?: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          fase?: Database["public"]["Enums"]["fase_campanha"]
          foco_principal?: string | null
          id?: string
          meta_campo?: string | null
          meta_digital?: string | null
          meta_financeiro?: string | null
          numero_semana?: number
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campanha_semanas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_semanas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_campanha"
            referencedColumns: ["campanha_id"]
          },
        ]
      }
      campanha_tarefas: {
        Row: {
          area: Database["public"]["Enums"]["area_campanha"]
          campanha_id: string
          created_at: string
          data_conclusao: string | null
          data_prevista: string
          descricao: string | null
          dia: number
          fase_id: string | null
          id: string
          observacoes: string | null
          ordem: number
          prioridade: Database["public"]["Enums"]["prioridade_demanda"]
          responsavel_id: string | null
          semana: number
          status: Database["public"]["Enums"]["status_tarefa"]
          titulo: string
          updated_at: string
        }
        Insert: {
          area: Database["public"]["Enums"]["area_campanha"]
          campanha_id: string
          created_at?: string
          data_conclusao?: string | null
          data_prevista: string
          descricao?: string | null
          dia: number
          fase_id?: string | null
          id?: string
          observacoes?: string | null
          ordem?: number
          prioridade?: Database["public"]["Enums"]["prioridade_demanda"]
          responsavel_id?: string | null
          semana: number
          status?: Database["public"]["Enums"]["status_tarefa"]
          titulo: string
          updated_at?: string
        }
        Update: {
          area?: Database["public"]["Enums"]["area_campanha"]
          campanha_id?: string
          created_at?: string
          data_conclusao?: string | null
          data_prevista?: string
          descricao?: string | null
          dia?: number
          fase_id?: string | null
          id?: string
          observacoes?: string | null
          ordem?: number
          prioridade?: Database["public"]["Enums"]["prioridade_demanda"]
          responsavel_id?: string | null
          semana?: number
          status?: Database["public"]["Enums"]["status_tarefa"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanha_tarefas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_tarefas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_campanha"
            referencedColumns: ["campanha_id"]
          },
          {
            foreignKeyName: "campanha_tarefas_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "campanha_fases"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas: {
        Row: {
          ativa: boolean
          candidato_pessoa_id: string | null
          cargo: Database["public"]["Enums"]["cargo_eleitoral"]
          coligacao: string | null
          created_at: string
          data_eleicao: string
          data_inicio_plano: string
          estado_id: string | null
          id: string
          meta_votos: number | null
          municipio_id: string | null
          municipios_foco_ids: string[]
          nome: string
          numero_urna: string | null
          observacoes: string | null
          orcamento_total: number | null
          partido_sigla: string | null
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          candidato_pessoa_id?: string | null
          cargo: Database["public"]["Enums"]["cargo_eleitoral"]
          coligacao?: string | null
          created_at?: string
          data_eleicao: string
          data_inicio_plano?: string
          estado_id?: string | null
          id?: string
          meta_votos?: number | null
          municipio_id?: string | null
          municipios_foco_ids?: string[]
          nome: string
          numero_urna?: string | null
          observacoes?: string | null
          orcamento_total?: number | null
          partido_sigla?: string | null
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          candidato_pessoa_id?: string | null
          cargo?: Database["public"]["Enums"]["cargo_eleitoral"]
          coligacao?: string | null
          created_at?: string
          data_eleicao?: string
          data_inicio_plano?: string
          estado_id?: string | null
          id?: string
          meta_votos?: number | null
          municipio_id?: string | null
          municipios_foco_ids?: string[]
          nome?: string
          numero_urna?: string | null
          observacoes?: string | null
          orcamento_total?: number | null
          partido_sigla?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_candidato_pessoa_id_fkey"
            columns: ["candidato_pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
          },
          {
            foreignKeyName: "campanhas_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      centros_custo: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          orcamento_previsto: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          orcamento_previsto?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          orcamento_previsto?: number
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "comunidades_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["bairro_id"]
          },
          {
            foreignKeyName: "comunidades_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "v_lacunas_territoriais"
            referencedColumns: ["bairro_id"]
          },
        ]
      }
      contratos: {
        Row: {
          arquivo_url: string | null
          campanha_id: string | null
          centro_custo_id: string | null
          created_at: string
          created_by: string | null
          data_fim: string
          data_inicio: string
          fornecedor_pessoa_id: string | null
          id: string
          numero: string | null
          objeto: string
          observacoes: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["contrato_status"]
          updated_at: string
          valor: number
        }
        Insert: {
          arquivo_url?: string | null
          campanha_id?: string | null
          centro_custo_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fim: string
          data_inicio: string
          fornecedor_pessoa_id?: string | null
          id?: string
          numero?: string | null
          objeto: string
          observacoes?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["contrato_status"]
          updated_at?: string
          valor?: number
        }
        Update: {
          arquivo_url?: string | null
          campanha_id?: string | null
          centro_custo_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string
          data_inicio?: string
          fornecedor_pessoa_id?: string | null
          id?: string
          numero?: string | null
          objeto?: string
          observacoes?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["contrato_status"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_campanha"
            referencedColumns: ["campanha_id"]
          },
          {
            foreignKeyName: "contratos_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_fornecedor_pessoa_id_fkey"
            columns: ["fornecedor_pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
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
            foreignKeyName: "demandas_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["bairro_id"]
          },
          {
            foreignKeyName: "demandas_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "v_lacunas_territoriais"
            referencedColumns: ["bairro_id"]
          },
          {
            foreignKeyName: "demandas_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
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
      despesas: {
        Row: {
          aprovador_id: string | null
          categoria: Database["public"]["Enums"]["categoria_despesa"]
          centro_custo_id: string | null
          created_at: string
          data_despesa: string
          data_pagamento: string | null
          descricao: string
          documento_numero: string | null
          documento_tipo: string | null
          documento_url: string | null
          fornecedor_pessoa_id: string | null
          id: string
          responsavel_id: string | null
          status: Database["public"]["Enums"]["status_despesa"]
          updated_at: string
          valor: number
        }
        Insert: {
          aprovador_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_despesa"]
          centro_custo_id?: string | null
          created_at?: string
          data_despesa?: string
          data_pagamento?: string | null
          descricao: string
          documento_numero?: string | null
          documento_tipo?: string | null
          documento_url?: string | null
          fornecedor_pessoa_id?: string | null
          id?: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_despesa"]
          updated_at?: string
          valor: number
        }
        Update: {
          aprovador_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_despesa"]
          centro_custo_id?: string | null
          created_at?: string
          data_despesa?: string
          data_pagamento?: string | null
          descricao?: string
          documento_numero?: string | null
          documento_tipo?: string | null
          documento_url?: string | null
          fornecedor_pessoa_id?: string | null
          id?: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_despesa"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_fornecedor_pessoa_id_fkey"
            columns: ["fornecedor_pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
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
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
          },
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
      estoques: {
        Row: {
          centro_distribuicao: string
          created_at: string
          id: string
          material_id: string
          municipio_id: string | null
          quantidade_atual: number
          quantidade_minima: number
          updated_at: string
        }
        Insert: {
          centro_distribuicao?: string
          created_at?: string
          id?: string
          material_id: string
          municipio_id?: string | null
          quantidade_atual?: number
          quantidade_minima?: number
          updated_at?: string
        }
        Update: {
          centro_distribuicao?: string
          created_at?: string
          id?: string
          material_id?: string
          municipio_id?: string | null
          quantidade_atual?: number
          quantidade_minima?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoques_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoques_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
          },
          {
            foreignKeyName: "estoques_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      evidencias: {
        Row: {
          arquivo_url: string
          created_at: string
          created_by: string | null
          descricao: string | null
          entidade_id: string
          entidade_tipo: string
          id: string
          mime_type: string | null
          tamanho_bytes: number | null
          titulo: string
          versao: number
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          entidade_id: string
          entidade_tipo: string
          id?: string
          mime_type?: string | null
          tamanho_bytes?: number | null
          titulo: string
          versao?: number
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          mime_type?: string | null
          tamanho_bytes?: number | null
          titulo?: string
          versao?: number
        }
        Relationships: []
      }
      incidentes: {
        Row: {
          acoes_tomadas: string | null
          campanha_id: string | null
          categoria: Database["public"]["Enums"]["risco_categoria"]
          created_at: string
          created_by: string | null
          data_ocorrencia: string
          data_resolucao: string | null
          descricao: string | null
          id: string
          responsavel_id: string | null
          risco_id: string | null
          severidade: Database["public"]["Enums"]["risco_severidade"]
          status: Database["public"]["Enums"]["incidente_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          acoes_tomadas?: string | null
          campanha_id?: string | null
          categoria: Database["public"]["Enums"]["risco_categoria"]
          created_at?: string
          created_by?: string | null
          data_ocorrencia?: string
          data_resolucao?: string | null
          descricao?: string | null
          id?: string
          responsavel_id?: string | null
          risco_id?: string | null
          severidade?: Database["public"]["Enums"]["risco_severidade"]
          status?: Database["public"]["Enums"]["incidente_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          acoes_tomadas?: string | null
          campanha_id?: string | null
          categoria?: Database["public"]["Enums"]["risco_categoria"]
          created_at?: string
          created_by?: string | null
          data_ocorrencia?: string
          data_resolucao?: string | null
          descricao?: string | null
          id?: string
          responsavel_id?: string | null
          risco_id?: string | null
          severidade?: Database["public"]["Enums"]["risco_severidade"]
          status?: Database["public"]["Enums"]["incidente_status"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidentes_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidentes_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_campanha"
            referencedColumns: ["campanha_id"]
          },
          {
            foreignKeyName: "incidentes_risco_id_fkey"
            columns: ["risco_id"]
            isOneToOne: false
            referencedRelation: "riscos"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          ativo: boolean
          created_at: string
          custo_unitario: number | null
          descricao: string | null
          foto_url: string | null
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_material"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          custo_unitario?: number | null
          descricao?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          tipo?: Database["public"]["Enums"]["tipo_material"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          custo_unitario?: number | null
          descricao?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["tipo_material"]
          updated_at?: string
        }
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: {
          agenda_id: string | null
          created_at: string
          estoque_id: string
          id: string
          motivo: string | null
          quantidade: number
          responsavel_id: string | null
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
        }
        Insert: {
          agenda_id?: string | null
          created_at?: string
          estoque_id: string
          id?: string
          motivo?: string | null
          quantidade: number
          responsavel_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
        }
        Update: {
          agenda_id?: string | null
          created_at?: string
          estoque_id?: string
          id?: string
          motivo?: string | null
          quantidade?: number
          responsavel_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimentacao"]
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agenda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_estoque_id_fkey"
            columns: ["estoque_id"]
            isOneToOne: false
            referencedRelation: "estoques"
            referencedColumns: ["id"]
          },
        ]
      }
      municipios: {
        Row: {
          classificacao_estrategica: string | null
          created_at: string
          eleitorado_total: number | null
          estado_id: string
          geocodigo_ibge: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          notas_estrategicas: string | null
          populacao: number | null
          prioridade_campanha: number | null
          updated_at: string
        }
        Insert: {
          classificacao_estrategica?: string | null
          created_at?: string
          eleitorado_total?: number | null
          estado_id: string
          geocodigo_ibge?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          notas_estrategicas?: string | null
          populacao?: number | null
          prioridade_campanha?: number | null
          updated_at?: string
        }
        Update: {
          classificacao_estrategica?: string | null
          created_at?: string
          eleitorado_total?: number | null
          estado_id?: string
          geocodigo_ibge?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          notas_estrategicas?: string | null
          populacao?: number | null
          prioridade_campanha?: number | null
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
      notificacoes: {
        Row: {
          created_at: string
          created_by: string | null
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          lida: boolean
          lida_em: string | null
          link: string | null
          mensagem: string | null
          prioridade: Database["public"]["Enums"]["notificacao_prioridade"]
          tipo: Database["public"]["Enums"]["notificacao_tipo"]
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          lida?: boolean
          lida_em?: string | null
          link?: string | null
          mensagem?: string | null
          prioridade?: Database["public"]["Enums"]["notificacao_prioridade"]
          tipo?: Database["public"]["Enums"]["notificacao_tipo"]
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          lida?: boolean
          lida_em?: string | null
          link?: string | null
          mensagem?: string | null
          prioridade?: Database["public"]["Enums"]["notificacao_prioridade"]
          tipo?: Database["public"]["Enums"]["notificacao_tipo"]
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      pessoas: {
        Row: {
          cnpj: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          data_fundacao: string | null
          data_nascimento: string | null
          escolaridade: string | null
          full_name: string
          genero: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          meta_votos: number | null
          nivel_relacionamento: Database["public"]["Enums"]["nivel_relacionamento"]
          nome_fantasia: string | null
          observacoes: string | null
          porte: Database["public"]["Enums"]["porte_empresa"] | null
          proxima_acao: string | null
          razao_social: string | null
          responsavel_area: string | null
          responsavel_legal: string | null
          segmento: string | null
          site: string | null
          tipo_pessoa: Database["public"]["Enums"]["tipo_pessoa"]
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          data_fundacao?: string | null
          data_nascimento?: string | null
          escolaridade?: string | null
          full_name: string
          genero?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          meta_votos?: number | null
          nivel_relacionamento?: Database["public"]["Enums"]["nivel_relacionamento"]
          nome_fantasia?: string | null
          observacoes?: string | null
          porte?: Database["public"]["Enums"]["porte_empresa"] | null
          proxima_acao?: string | null
          razao_social?: string | null
          responsavel_area?: string | null
          responsavel_legal?: string | null
          segmento?: string | null
          site?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa"]
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          data_fundacao?: string | null
          data_nascimento?: string | null
          escolaridade?: string | null
          full_name?: string
          genero?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          meta_votos?: number | null
          nivel_relacionamento?: Database["public"]["Enums"]["nivel_relacionamento"]
          nome_fantasia?: string | null
          observacoes?: string | null
          porte?: Database["public"]["Enums"]["porte_empresa"] | null
          proxima_acao?: string | null
          razao_social?: string | null
          responsavel_area?: string | null
          responsavel_legal?: string | null
          segmento?: string | null
          site?: string | null
          tipo_pessoa?: Database["public"]["Enums"]["tipo_pessoa"]
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
            foreignKeyName: "pessoas_enderecos_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["bairro_id"]
          },
          {
            foreignKeyName: "pessoas_enderecos_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "v_lacunas_territoriais"
            referencedColumns: ["bairro_id"]
          },
          {
            foreignKeyName: "pessoas_enderecos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
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
      receitas: {
        Row: {
          centro_custo_id: string | null
          created_at: string
          data: string
          descricao: string | null
          documento_url: string | null
          id: string
          origem_pessoa_id: string | null
          tipo: Database["public"]["Enums"]["tipo_receita"]
          updated_at: string
          valor: number
        }
        Insert: {
          centro_custo_id?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          documento_url?: string | null
          id?: string
          origem_pessoa_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_receita"]
          updated_at?: string
          valor: number
        }
        Update: {
          centro_custo_id?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          documento_url?: string | null
          id?: string
          origem_pessoa_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_receita"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "receitas_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receitas_origem_pessoa_id_fkey"
            columns: ["origem_pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      reuniao_deliberacoes: {
        Row: {
          created_at: string
          descricao: string
          id: string
          observacoes: string | null
          prazo: string | null
          responsavel_id: string | null
          reuniao_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          observacoes?: string | null
          prazo?: string | null
          responsavel_id?: string | null
          reuniao_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          prazo?: string | null
          responsavel_id?: string | null
          reuniao_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reuniao_deliberacoes_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: false
            referencedRelation: "reunioes"
            referencedColumns: ["id"]
          },
        ]
      }
      reunioes: {
        Row: {
          ata: string | null
          campanha_id: string | null
          created_at: string
          created_by: string | null
          data_reuniao: string
          id: string
          local: string | null
          pauta: string | null
          responsavel_id: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ata?: string | null
          campanha_id?: string | null
          created_at?: string
          created_by?: string | null
          data_reuniao: string
          id?: string
          local?: string | null
          pauta?: string | null
          responsavel_id?: string | null
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ata?: string | null
          campanha_id?: string | null
          created_at?: string
          created_by?: string | null
          data_reuniao?: string
          id?: string
          local?: string | null
          pauta?: string | null
          responsavel_id?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reunioes_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_campanha"
            referencedColumns: ["campanha_id"]
          },
        ]
      }
      riscos: {
        Row: {
          campanha_id: string | null
          categoria: Database["public"]["Enums"]["risco_categoria"]
          created_at: string
          created_by: string | null
          data_revisao: string | null
          descricao: string | null
          id: string
          impacto: number
          plano_mitigacao: string | null
          probabilidade: number
          responsavel_id: string | null
          severidade: Database["public"]["Enums"]["risco_severidade"]
          status: Database["public"]["Enums"]["risco_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          campanha_id?: string | null
          categoria: Database["public"]["Enums"]["risco_categoria"]
          created_at?: string
          created_by?: string | null
          data_revisao?: string | null
          descricao?: string | null
          id?: string
          impacto?: number
          plano_mitigacao?: string | null
          probabilidade?: number
          responsavel_id?: string | null
          severidade?: Database["public"]["Enums"]["risco_severidade"]
          status?: Database["public"]["Enums"]["risco_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          campanha_id?: string | null
          categoria?: Database["public"]["Enums"]["risco_categoria"]
          created_at?: string
          created_by?: string | null
          data_revisao?: string | null
          descricao?: string | null
          id?: string
          impacto?: number
          plano_mitigacao?: string | null
          probabilidade?: number
          responsavel_id?: string | null
          severidade?: Database["public"]["Enums"]["risco_severidade"]
          status?: Database["public"]["Enums"]["risco_status"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riscos_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riscos_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_campanha"
            referencedColumns: ["campanha_id"]
          },
        ]
      }
      roteiros_paradas: {
        Row: {
          concluido: boolean
          created_at: string
          endereco: string | null
          hora_chegada: string | null
          hora_saida: string | null
          id: string
          latitude: number | null
          longitude: number | null
          observacao: string | null
          ordem: number
          pessoa_id: string | null
          roteiro_id: string
          tipo: Database["public"]["Enums"]["tipo_parada"]
        }
        Insert: {
          concluido?: boolean
          created_at?: string
          endereco?: string | null
          hora_chegada?: string | null
          hora_saida?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          observacao?: string | null
          ordem?: number
          pessoa_id?: string | null
          roteiro_id: string
          tipo?: Database["public"]["Enums"]["tipo_parada"]
        }
        Update: {
          concluido?: boolean
          created_at?: string
          endereco?: string | null
          hora_chegada?: string | null
          hora_saida?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          observacao?: string | null
          ordem?: number
          pessoa_id?: string | null
          roteiro_id?: string
          tipo?: Database["public"]["Enums"]["tipo_parada"]
        }
        Relationships: [
          {
            foreignKeyName: "roteiros_paradas_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roteiros_paradas_roteiro_id_fkey"
            columns: ["roteiro_id"]
            isOneToOne: false
            referencedRelation: "roteiros_visita"
            referencedColumns: ["id"]
          },
        ]
      }
      roteiros_visita: {
        Row: {
          created_at: string
          data: string
          id: string
          municipio_id: string | null
          nome: string
          observacoes: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["status_roteiro"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          municipio_id?: string | null
          nome: string
          observacoes?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_roteiro"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          municipio_id?: string | null
          nome?: string
          observacoes?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_roteiro"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roteiros_visita_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
          },
          {
            foreignKeyName: "roteiros_visita_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
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
      tse_candidatos: {
        Row: {
          ano: number
          cargo: string
          cod_municipio_tse: string | null
          coligacao: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          eleito: boolean | null
          genero: string | null
          id: string
          municipio_id: string | null
          nome_completo: string | null
          nome_urna: string | null
          numero_urna: string
          ocupacao: string | null
          partido_numero: string | null
          partido_sigla: string | null
          raw: Json | null
          situacao_candidatura: string | null
          situacao_eleicao: string | null
          turno: number
          uf: string
          votos_recebidos: number | null
        }
        Insert: {
          ano: number
          cargo: string
          cod_municipio_tse?: string | null
          coligacao?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          eleito?: boolean | null
          genero?: string | null
          id?: string
          municipio_id?: string | null
          nome_completo?: string | null
          nome_urna?: string | null
          numero_urna: string
          ocupacao?: string | null
          partido_numero?: string | null
          partido_sigla?: string | null
          raw?: Json | null
          situacao_candidatura?: string | null
          situacao_eleicao?: string | null
          turno?: number
          uf: string
          votos_recebidos?: number | null
        }
        Update: {
          ano?: number
          cargo?: string
          cod_municipio_tse?: string | null
          coligacao?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          eleito?: boolean | null
          genero?: string | null
          id?: string
          municipio_id?: string | null
          nome_completo?: string | null
          nome_urna?: string | null
          numero_urna?: string
          ocupacao?: string | null
          partido_numero?: string | null
          partido_sigla?: string | null
          raw?: Json | null
          situacao_candidatura?: string | null
          situacao_eleicao?: string | null
          turno?: number
          uf?: string
          votos_recebidos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tse_candidatos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
          },
          {
            foreignKeyName: "tse_candidatos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      tse_eleitorado: {
        Row: {
          ano: number
          cod_municipio_tse: string | null
          created_at: string
          escolaridade: Json | null
          estado_civil: Json | null
          faixa_etaria: Json | null
          genero: Json | null
          id: string
          municipio_id: string | null
          secao: number | null
          total_eleitores: number
          uf: string
          zona: number | null
        }
        Insert: {
          ano: number
          cod_municipio_tse?: string | null
          created_at?: string
          escolaridade?: Json | null
          estado_civil?: Json | null
          faixa_etaria?: Json | null
          genero?: Json | null
          id?: string
          municipio_id?: string | null
          secao?: number | null
          total_eleitores?: number
          uf: string
          zona?: number | null
        }
        Update: {
          ano?: number
          cod_municipio_tse?: string | null
          created_at?: string
          escolaridade?: Json | null
          estado_civil?: Json | null
          faixa_etaria?: Json | null
          genero?: Json | null
          id?: string
          municipio_id?: string | null
          secao?: number | null
          total_eleitores?: number
          uf?: string
          zona?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tse_eleitorado_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
          },
          {
            foreignKeyName: "tse_eleitorado_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      tse_import_jobs: {
        Row: {
          ano: number
          attempts: number
          created_at: string
          created_by: string | null
          error_msg: string | null
          finished_at: string | null
          id: string
          municipio_cod: string | null
          progress_pct: number
          registros_processados: number | null
          source_url: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["tse_job_status"]
          tipo: Database["public"]["Enums"]["tse_job_tipo"]
          total_registros: number | null
          uf: string
          updated_at: string
        }
        Insert: {
          ano: number
          attempts?: number
          created_at?: string
          created_by?: string | null
          error_msg?: string | null
          finished_at?: string | null
          id?: string
          municipio_cod?: string | null
          progress_pct?: number
          registros_processados?: number | null
          source_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["tse_job_status"]
          tipo: Database["public"]["Enums"]["tse_job_tipo"]
          total_registros?: number | null
          uf: string
          updated_at?: string
        }
        Update: {
          ano?: number
          attempts?: number
          created_at?: string
          created_by?: string | null
          error_msg?: string | null
          finished_at?: string | null
          id?: string
          municipio_cod?: string | null
          progress_pct?: number
          registros_processados?: number | null
          source_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["tse_job_status"]
          tipo?: Database["public"]["Enums"]["tse_job_tipo"]
          total_registros?: number | null
          uf?: string
          updated_at?: string
        }
        Relationships: []
      }
      tse_import_logs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          level: string
          message: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          level?: string
          message: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          level?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "tse_import_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "tse_import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      tse_locais_votacao: {
        Row: {
          ano: number
          bairro: string | null
          cep: string | null
          cod_municipio_tse: string | null
          codigo_local: string
          created_at: string
          endereco: string | null
          id: string
          latitude: number | null
          longitude: number | null
          municipio_id: string | null
          nome_local: string | null
          uf: string
          zona: number
        }
        Insert: {
          ano: number
          bairro?: string | null
          cep?: string | null
          cod_municipio_tse?: string | null
          codigo_local: string
          created_at?: string
          endereco?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipio_id?: string | null
          nome_local?: string | null
          uf: string
          zona: number
        }
        Update: {
          ano?: number
          bairro?: string | null
          cep?: string | null
          cod_municipio_tse?: string | null
          codigo_local?: string
          created_at?: string
          endereco?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipio_id?: string | null
          nome_local?: string | null
          uf?: string
          zona?: number
        }
        Relationships: [
          {
            foreignKeyName: "tse_locais_votacao_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
          },
          {
            foreignKeyName: "tse_locais_votacao_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      tse_prestacao_contas: {
        Row: {
          ano: number
          candidato_id: string | null
          cargo: string | null
          cnpj_cpf_contraparte: string | null
          cpf_candidato: string | null
          created_at: string
          data_lancamento: string | null
          descricao: string | null
          fornecedor_doador: string | null
          id: string
          nome_candidato: string | null
          origem: string | null
          raw: Json | null
          tipo: string
          uf: string
          valor: number
        }
        Insert: {
          ano: number
          candidato_id?: string | null
          cargo?: string | null
          cnpj_cpf_contraparte?: string | null
          cpf_candidato?: string | null
          created_at?: string
          data_lancamento?: string | null
          descricao?: string | null
          fornecedor_doador?: string | null
          id?: string
          nome_candidato?: string | null
          origem?: string | null
          raw?: Json | null
          tipo: string
          uf: string
          valor?: number
        }
        Update: {
          ano?: number
          candidato_id?: string | null
          cargo?: string | null
          cnpj_cpf_contraparte?: string | null
          cpf_candidato?: string | null
          created_at?: string
          data_lancamento?: string | null
          descricao?: string | null
          fornecedor_doador?: string | null
          id?: string
          nome_candidato?: string | null
          origem?: string | null
          raw?: Json | null
          tipo?: string
          uf?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "tse_prestacao_contas_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "tse_candidatos"
            referencedColumns: ["id"]
          },
        ]
      }
      tse_resultados_secao: {
        Row: {
          ano: number
          cargo: string
          cod_municipio_tse: string | null
          created_at: string
          id: string
          municipio_id: string | null
          numero_votavel: string
          partido_sigla: string | null
          secao: number
          turno: number
          uf: string
          votos: number
          zona: number
        }
        Insert: {
          ano: number
          cargo: string
          cod_municipio_tse?: string | null
          created_at?: string
          id?: string
          municipio_id?: string | null
          numero_votavel: string
          partido_sigla?: string | null
          secao: number
          turno?: number
          uf: string
          votos?: number
          zona: number
        }
        Update: {
          ano?: number
          cargo?: string
          cod_municipio_tse?: string | null
          created_at?: string
          id?: string
          municipio_id?: string | null
          numero_votavel?: string
          partido_sigla?: string | null
          secao?: number
          turno?: number
          uf?: string
          votos?: number
          zona?: number
        }
        Relationships: [
          {
            foreignKeyName: "tse_resultados_secao_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
          },
          {
            foreignKeyName: "tse_resultados_secao_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
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
      user_scopes: {
        Row: {
          campanha_id: string | null
          created_at: string
          created_by: string | null
          estado_id: string | null
          id: string
          municipio_id: string | null
          user_id: string
        }
        Insert: {
          campanha_id?: string | null
          created_at?: string
          created_by?: string | null
          estado_id?: string | null
          id?: string
          municipio_id?: string | null
          user_id: string
        }
        Update: {
          campanha_id?: string | null
          created_at?: string
          created_by?: string | null
          estado_id?: string | null
          id?: string
          municipio_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_scopes_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_scopes_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_campanha"
            referencedColumns: ["campanha_id"]
          },
          {
            foreignKeyName: "user_scopes_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_scopes_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
          },
          {
            foreignKeyName: "user_scopes_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
          },
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
      mapa_estrategico_bairros: {
        Row: {
          apoiadores: number | null
          bairro_id: string | null
          bairro_nome: string | null
          classificacao:
            | Database["public"]["Enums"]["classificacao_territorial"]
            | null
          demandas_abertas: number | null
          demandas_resolvidas: number | null
          eleitores_cadastrados: number | null
          meta_votos_total: number | null
          municipio_id: string | null
          municipio_nome: string | null
        }
        Relationships: []
      }
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
      v_admin_stats_30d: {
        Row: {
          demandas: number | null
          despesas_valor: number | null
          dia: string | null
          eventos: number | null
          pessoas: number | null
        }
        Relationships: []
      }
      v_burndown_tarefas: {
        Row: {
          campanha_id: string | null
          concluidas_acumulado: number | null
          concluidas_dia: number | null
          data_prevista: string | null
          total_acumulado: number | null
          total_dia: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campanha_tarefas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_tarefas_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_campanha"
            referencedColumns: ["campanha_id"]
          },
        ]
      }
      v_busca_global: {
        Row: {
          created_at: string | null
          id: string | null
          link: string | null
          subtitulo: string | null
          tipo: string | null
          titulo: string | null
        }
        Relationships: []
      }
      v_contratos_alerta: {
        Row: {
          arquivo_url: string | null
          campanha_id: string | null
          centro_custo_id: string | null
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string | null
          dias_para_vencer: number | null
          fornecedor_pessoa_id: string | null
          id: string | null
          numero: string | null
          objeto: string | null
          observacoes: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["contrato_status"] | null
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          arquivo_url?: string | null
          campanha_id?: string | null
          centro_custo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          dias_para_vencer?: never
          fornecedor_pessoa_id?: string | null
          id?: string | null
          numero?: string | null
          objeto?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["contrato_status"] | null
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          arquivo_url?: string | null
          campanha_id?: string | null
          centro_custo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          dias_para_vencer?: never
          fornecedor_pessoa_id?: string | null
          id?: string | null
          numero?: string | null
          objeto?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["contrato_status"] | null
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "v_indicadores_campanha"
            referencedColumns: ["campanha_id"]
          },
          {
            foreignKeyName: "contratos_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_fornecedor_pessoa_id_fkey"
            columns: ["fornecedor_pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      v_indicadores_campanha: {
        Row: {
          campanha_id: string | null
          campanha_nome: string | null
          cargo: Database["public"]["Enums"]["cargo_eleitoral"] | null
          data_eleicao: string | null
          demandas_abertas: number | null
          demandas_resolvidas: number | null
          demandas_urgentes: number | null
          dias_restantes: number | null
          eventos_futuros: number | null
          meta_votos: number | null
          orcamento_total: number | null
          tarefas_atrasadas: number | null
          tarefas_concluidas: number | null
          tarefas_total: number | null
          total_gasto: number | null
          total_pessoas: number | null
        }
        Insert: {
          campanha_id?: string | null
          campanha_nome?: string | null
          cargo?: Database["public"]["Enums"]["cargo_eleitoral"] | null
          data_eleicao?: string | null
          demandas_abertas?: never
          demandas_resolvidas?: never
          demandas_urgentes?: never
          dias_restantes?: never
          eventos_futuros?: never
          meta_votos?: number | null
          orcamento_total?: never
          tarefas_atrasadas?: never
          tarefas_concluidas?: never
          tarefas_total?: never
          total_gasto?: never
          total_pessoas?: never
        }
        Update: {
          campanha_id?: string | null
          campanha_nome?: string | null
          cargo?: Database["public"]["Enums"]["cargo_eleitoral"] | null
          data_eleicao?: string | null
          demandas_abertas?: never
          demandas_resolvidas?: never
          demandas_urgentes?: never
          dias_restantes?: never
          eventos_futuros?: never
          meta_votos?: number | null
          orcamento_total?: never
          tarefas_atrasadas?: never
          tarefas_concluidas?: never
          tarefas_total?: never
          total_gasto?: never
          total_pessoas?: never
        }
        Relationships: []
      }
      v_lacunas_territoriais: {
        Row: {
          bairro_id: string | null
          bairro_nome: string | null
          classificacao:
            | Database["public"]["Enums"]["classificacao_territorial"]
            | null
          demandas_abertas: number | null
          latitude: number | null
          longitude: number | null
          municipio_id: string | null
          municipio_nome: string | null
          score_prioridade: number | null
          total_eventos: number | null
          total_pessoas: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bairros_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "mapa_estrategico_bairros"
            referencedColumns: ["municipio_id"]
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
    }
    Functions: {
      criar_notificacao: {
        Args: {
          _entidade_id?: string
          _entidade_tipo?: string
          _link?: string
          _mensagem?: string
          _prioridade?: Database["public"]["Enums"]["notificacao_prioridade"]
          _tipo?: Database["public"]["Enums"]["notificacao_tipo"]
          _titulo: string
          _user_id: string
        }
        Returns: string
      }
      gerar_plano_90_dias: {
        Args: { _campanha_id: string }
        Returns: undefined
      }
      has_manage_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      inicializar_parametros_campanha: {
        Args: { _campanha_id: string }
        Returns: string
      }
      notificar_gestores: {
        Args: {
          _entidade_id?: string
          _entidade_tipo?: string
          _link?: string
          _mensagem?: string
          _prioridade?: Database["public"]["Enums"]["notificacao_prioridade"]
          _tipo?: Database["public"]["Enums"]["notificacao_tipo"]
          _titulo: string
        }
        Returns: number
      }
      unaccent: { Args: { "": string }; Returns: string }
      user_has_campanha_scope: {
        Args: { _campanha_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_municipio_scope: {
        Args: { _municipio_id: string; _user_id: string }
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
      area_campanha:
        | "organizacao"
        | "campo"
        | "digital"
        | "financeiro"
        | "juridico"
        | "comunicacao"
        | "logistica"
        | "dados"
      cargo_eleitoral:
        | "vereador"
        | "prefeito"
        | "vice_prefeito"
        | "deputado_estadual"
        | "deputado_federal"
        | "senador"
        | "governador"
        | "presidente"
        | "vice_governador"
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
      categoria_despesa:
        | "pessoal"
        | "material"
        | "transporte"
        | "alimentacao"
        | "comunicacao"
        | "evento"
        | "juridico"
        | "outros"
      classificacao_territorial:
        | "reduto"
        | "expansao"
        | "disputa"
        | "risco"
        | "baixa_presenca"
      contrato_status:
        | "rascunho"
        | "vigente"
        | "encerrado"
        | "cancelado"
        | "vencido"
      fase_campanha:
        | "pre_campanha"
        | "lancamento"
        | "consolidacao"
        | "reta_final"
      finalidade_lgpd:
        | "comunicacao_politica"
        | "pesquisa"
        | "campanha"
        | "mandato"
      incidente_status: "aberto" | "em_apuracao" | "resolvido" | "arquivado"
      nivel_relacionamento:
        | "desconhecido"
        | "frio"
        | "morno"
        | "quente"
        | "aliado"
        | "lideranca"
      notificacao_prioridade: "baixa" | "media" | "alta" | "urgente"
      notificacao_tipo:
        | "info"
        | "sucesso"
        | "aviso"
        | "erro"
        | "demanda"
        | "agenda"
        | "financeiro"
        | "tarefa"
        | "sistema"
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
      porte_empresa: "mei" | "me" | "epp" | "medio" | "grande"
      prioridade_demanda: "baixa" | "media" | "alta" | "urgente"
      risco_categoria:
        | "juridico"
        | "reputacional"
        | "financeiro"
        | "operacional"
        | "eleitoral"
      risco_severidade: "baixa" | "media" | "alta" | "critica"
      risco_status:
        | "identificado"
        | "em_mitigacao"
        | "mitigado"
        | "aceito"
        | "materializado"
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
      status_despesa: "pendente" | "aprovada" | "paga" | "cancelada"
      status_roteiro: "planejado" | "em_campo" | "concluido" | "cancelado"
      status_tarefa:
        | "pendente"
        | "em_andamento"
        | "concluida"
        | "atrasada"
        | "cancelada"
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
      tipo_material:
        | "grafico"
        | "brinde"
        | "camiseta"
        | "adesivo"
        | "banner"
        | "santinho"
        | "outros"
      tipo_movimentacao: "entrada" | "saida" | "transferencia" | "perda"
      tipo_parada: "visita" | "entrega" | "coleta"
      tipo_pessoa: "pf" | "pj"
      tipo_receita:
        | "doacao"
        | "fundo_partidario"
        | "recursos_proprios"
        | "outros"
      tipo_vinculo:
        | "familiar"
        | "comunitario"
        | "profissional"
        | "politico"
        | "indicacao"
      tse_job_status: "queued" | "running" | "done" | "failed" | "cancelled"
      tse_job_tipo:
        | "eleitorado"
        | "locais"
        | "candidatos"
        | "resultados"
        | "prestacao_contas"
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
      area_campanha: [
        "organizacao",
        "campo",
        "digital",
        "financeiro",
        "juridico",
        "comunicacao",
        "logistica",
        "dados",
      ],
      cargo_eleitoral: [
        "vereador",
        "prefeito",
        "vice_prefeito",
        "deputado_estadual",
        "deputado_federal",
        "senador",
        "governador",
        "presidente",
        "vice_governador",
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
      categoria_despesa: [
        "pessoal",
        "material",
        "transporte",
        "alimentacao",
        "comunicacao",
        "evento",
        "juridico",
        "outros",
      ],
      classificacao_territorial: [
        "reduto",
        "expansao",
        "disputa",
        "risco",
        "baixa_presenca",
      ],
      contrato_status: [
        "rascunho",
        "vigente",
        "encerrado",
        "cancelado",
        "vencido",
      ],
      fase_campanha: [
        "pre_campanha",
        "lancamento",
        "consolidacao",
        "reta_final",
      ],
      finalidade_lgpd: [
        "comunicacao_politica",
        "pesquisa",
        "campanha",
        "mandato",
      ],
      incidente_status: ["aberto", "em_apuracao", "resolvido", "arquivado"],
      nivel_relacionamento: [
        "desconhecido",
        "frio",
        "morno",
        "quente",
        "aliado",
        "lideranca",
      ],
      notificacao_prioridade: ["baixa", "media", "alta", "urgente"],
      notificacao_tipo: [
        "info",
        "sucesso",
        "aviso",
        "erro",
        "demanda",
        "agenda",
        "financeiro",
        "tarefa",
        "sistema",
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
      porte_empresa: ["mei", "me", "epp", "medio", "grande"],
      prioridade_demanda: ["baixa", "media", "alta", "urgente"],
      risco_categoria: [
        "juridico",
        "reputacional",
        "financeiro",
        "operacional",
        "eleitoral",
      ],
      risco_severidade: ["baixa", "media", "alta", "critica"],
      risco_status: [
        "identificado",
        "em_mitigacao",
        "mitigado",
        "aceito",
        "materializado",
      ],
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
      status_despesa: ["pendente", "aprovada", "paga", "cancelada"],
      status_roteiro: ["planejado", "em_campo", "concluido", "cancelado"],
      status_tarefa: [
        "pendente",
        "em_andamento",
        "concluida",
        "atrasada",
        "cancelada",
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
      tipo_material: [
        "grafico",
        "brinde",
        "camiseta",
        "adesivo",
        "banner",
        "santinho",
        "outros",
      ],
      tipo_movimentacao: ["entrada", "saida", "transferencia", "perda"],
      tipo_parada: ["visita", "entrega", "coleta"],
      tipo_pessoa: ["pf", "pj"],
      tipo_receita: [
        "doacao",
        "fundo_partidario",
        "recursos_proprios",
        "outros",
      ],
      tipo_vinculo: [
        "familiar",
        "comunitario",
        "profissional",
        "politico",
        "indicacao",
      ],
      tse_job_status: ["queued", "running", "done", "failed", "cancelled"],
      tse_job_tipo: [
        "eleitorado",
        "locais",
        "candidatos",
        "resultados",
        "prestacao_contas",
      ],
    },
  },
} as const
