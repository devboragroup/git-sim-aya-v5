export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      empreendimentos: {
        Row: {
          id: string
          nome: string
          endereco: string | null
          registro: string | null
          tipo: string | null
          descricao: string | null
          vgv_bruto_alvo: number | null
          percentual_permuta: number | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nome: string
          endereco?: string | null
          registro?: string | null
          tipo?: string | null
          descricao?: string | null
          vgv_bruto_alvo?: number | null
          percentual_permuta?: number | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          endereco?: string | null
          registro?: string | null
          tipo?: string | null
          descricao?: string | null
          vgv_bruto_alvo?: number | null
          percentual_permuta?: number | null
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      unidades: {
        Row: {
          id: string
          empreendimento_id: string
          identificador: string
          tipo: string
          area_privativa: number
          area_total: number | null
          pavimento: number | null
          dormitorios: number | null
          suites: number | null
          vagas: number | null
          orientacao_solar: string | null
          fator_pavimento: number | null
          fator_ajuste_fino: number | null
          ajuste_fino_percentual: number | null
          valor_calculado: number | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          empreendimento_id: string
          identificador: string
          tipo: string
          area_privativa: number
          area_total?: number | null
          pavimento?: number | null
          dormitorios?: number | null
          suites?: number | null
          vagas?: number | null
          orientacao_solar?: string | null
          fator_pavimento?: number | null
          fator_ajuste_fino?: number | null
          ajuste_fino_percentual?: number | null
          valor_calculado?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          empreendimento_id?: string
          identificador?: string
          tipo?: string
          area_privativa?: number
          area_total?: number | null
          pavimento?: number | null
          dormitorios?: number | null
          suites?: number | null
          vagas?: number | null
          orientacao_solar?: string | null
          fator_pavimento?: number | null
          fator_ajuste_fino?: number | null
          ajuste_fino_percentual?: number | null
          valor_calculado?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}
