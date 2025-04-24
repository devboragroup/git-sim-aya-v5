export interface ParametroPrecificacao {
  id: string
  empreendimento_id: string
  nome: string
  descricao: string | null
  // Valores por m² para diferentes tipos de unidade
  valor_m2_studio: number
  valor_m2_apartamento: number
  valor_m2_comercial: number
  valor_m2_garden: number
  // Valores adicionais
  valor_adicional_suite: number
  valor_adicional_vaga_simples: number
  valor_adicional_vaga_dupla: number
  valor_adicional_vaga_moto: number
  valor_adicional_hobby_box: number
  // Fatores de orientação solar (8 direções)
  fator_norte: number
  fator_sul: number
  fator_leste: number
  fator_oeste: number
  fator_nordeste: number
  fator_noroeste: number
  fator_sudeste: number
  fator_sudoeste: number
  ativo: boolean
  created_at: string | null
  updated_at: string | null
  // Valorizações por pavimento
  valorizacoes_pavimento?: ValorizacaoPavimento[]
}

export interface ValorizacaoPavimento {
  id?: string
  parametro_id: string
  pavimento: number
  percentual: number
  created_at?: string | null
  updated_at?: string | null
}

export interface FatorPavimento {
  id: string
  parametro_id: string
  pavimento: number
  descricao: string | null
  fator: number
  created_at: string | null
  updated_at: string | null
}

export interface ParametroFormValues {
  nome: string
  descricao?: string
  // Valores por m² para diferentes tipos de unidade
  valor_m2_studio: string
  valor_m2_apartamento: string
  valor_m2_comercial: string
  valor_m2_garden: string
  // Valores adicionais
  valor_adicional_suite: string
  valor_adicional_vaga_simples: string
  valor_adicional_vaga_dupla: string
  valor_adicional_vaga_moto: string
  valor_adicional_hobby_box: string
  // Fatores de orientação solar (8 direções)
  fator_norte: string
  fator_sul: string
  fator_leste: string
  fator_oeste: string
  fator_nordeste: string
  fator_noroeste: string
  fator_sudeste: string
  fator_sudoeste: string
  // Valorizações por pavimento (0 a 20)
  valorizacoes_pavimento: { [key: number]: string }
}

export interface FatorPavimentoFormValues {
  pavimento: number
  descricao?: string
  fator: string
}

export interface UnidadeComValor {
  id: string
  identificador: string
  tipo_unidade: string
  area_privativa: number
  pavimento: number | null
  suites: number | null
  vagas: number | null
  vagas_simples: number | null
  vagas_duplas: number | null
  vagas_moto: number | null
  hobby_box: number | null
  orientacao_solar: string | null
  ajuste_fino_percentual: number | null
  valor_calculado: number | null
}
