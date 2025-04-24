"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import type { ParametroFormValues, FatorPavimentoFormValues, ValorizacaoPavimento } from "@/types/parametros"

export async function criarParametroPrecificacao(
  empreendimentoId: string,
  data: ParametroFormValues & { valorizacoes_pavimento: ValorizacaoPavimento[] },
) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Usuário não autenticado" }
  }

  try {
    // Validar dados
    if (!data.nome || data.nome.length < 3) {
      return { error: "Nome deve ter pelo menos 3 caracteres" }
    }

    // Converter valores para números
    const parametro = {
      empreendimento_id: empreendimentoId,
      nome: data.nome,
      descricao: data.descricao || null,
      // Valores por m² para diferentes tipos de unidade
      valor_m2_studio: Number.parseFloat(data.valor_m2_studio) || 0,
      valor_m2_apartamento: Number.parseFloat(data.valor_m2_apartamento) || 0,
      valor_m2_comercial: Number.parseFloat(data.valor_m2_comercial) || 0,
      valor_m2_garden: Number.parseFloat(data.valor_m2_garden) || 0,
      // Valores adicionais
      valor_adicional_suite: Number.parseFloat(data.valor_adicional_suite) || 0,
      valor_adicional_vaga_simples: Number.parseFloat(data.valor_adicional_vaga_simples) || 0,
      valor_adicional_vaga_dupla: Number.parseFloat(data.valor_adicional_vaga_dupla) || 0,
      valor_adicional_vaga_moto: Number.parseFloat(data.valor_adicional_vaga_moto) || 0,
      valor_adicional_hobby_box: Number.parseFloat(data.valor_adicional_hobby_box) || 0,
      // Fatores de orientação solar (8 direções)
      fator_norte: Number.parseFloat(data.fator_norte) || 1,
      fator_sul: Number.parseFloat(data.fator_sul) || 1,
      fator_leste: Number.parseFloat(data.fator_leste) || 1,
      fator_oeste: Number.parseFloat(data.fator_oeste) || 1,
      fator_nordeste: Number.parseFloat(data.fator_nordeste) || 1,
      fator_noroeste: Number.parseFloat(data.fator_noroeste) || 1,
      fator_sudeste: Number.parseFloat(data.fator_sudeste) || 1,
      fator_sudoeste: Number.parseFloat(data.fator_sudoeste) || 1,
      ativo: false, // Inicialmente inativo
    }

    // Inserir o parâmetro
    const { data: novoParametro, error } = await supabase
      .from("parametros_precificacao")
      .insert(parametro)
      .select("id")
      .single()

    if (error) {
      console.error("Erro ao criar parâmetro de precificação:", error)
      return { error: error.message }
    }

    // Inserir valorizações por pavimento
    if (data.valorizacoes_pavimento && data.valorizacoes_pavimento.length > 0) {
      // Garantir que temos valorizações para todos os pavimentos de 0 a 20
      const valorizacoes = []
      for (let i = 0; i <= 20; i++) {
        const valorPavimento = data.valorizacoes_pavimento.find((v) => v.pavimento === i)
        valorizacoes.push({
          parametro_id: novoParametro.id,
          pavimento: i,
          percentual: valorPavimento ? valorPavimento.percentual : 0,
        })
      }

      const { error: errorValorizacoes } = await supabase.from("valorizacao_pavimentos").insert(valorizacoes)

      if (errorValorizacoes) {
        console.error("Erro ao inserir valorizações por pavimento:", errorValorizacoes)
        // Não falhar completamente se houver erro nas valorizações
      }
    }

    // Tentar registrar atividade
    try {
      await supabase.rpc("registrar_atividade", {
        p_usuario_id: session.user.id,
        p_modulo: "empreendimentos",
        p_acao: "criar",
        p_descricao: `Criação do parâmetro de precificação ${data.nome}`,
        p_entidade_tipo: "parametros_precificacao",
        p_entidade_id: novoParametro.id,
        p_dados: parametro,
        p_ip_address: "127.0.0.1",
      })
    } catch (activityError) {
      console.error("Erro ao registrar atividade (não crítico):", activityError)
    }

    // Revalidar o cache
    revalidatePath(`/empreendimentos/${empreendimentoId}/parametros`)

    return { id: novoParametro.id }
  } catch (error: any) {
    console.error("Erro ao criar parâmetro de precificação:", error)
    return { error: error.message || "Erro ao criar parâmetro de precificação" }
  }
}

export async function atualizarParametroPrecificacao(
  parametroId: string,
  data: ParametroFormValues & { valorizacoes_pavimento: ValorizacaoPavimento[] },
) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Usuário não autenticado" }
  }

  try {
    // Validar dados
    if (!data.nome || data.nome.length < 3) {
      return { error: "Nome deve ter pelo menos 3 caracteres" }
    }

    // Buscar o empreendimento_id do parâmetro
    const { data: parametroAtual, error: errorBusca } = await supabase
      .from("parametros_precificacao")
      .select("empreendimento_id")
      .eq("id", parametroId)
      .single()

    if (errorBusca) {
      return { error: "Parâmetro não encontrado" }
    }

    // Converter valores para números
    const parametro = {
      nome: data.nome,
      descricao: data.descricao || null,
      // Valores por m² para diferentes tipos de unidade
      valor_m2_studio: Number.parseFloat(data.valor_m2_studio) || 0,
      valor_m2_apartamento: Number.parseFloat(data.valor_m2_apartamento) || 0,
      valor_m2_comercial: Number.parseFloat(data.valor_m2_comercial) || 0,
      valor_m2_garden: Number.parseFloat(data.valor_m2_garden) || 0,
      // Valores adicionais
      valor_adicional_suite: Number.parseFloat(data.valor_adicional_suite) || 0,
      valor_adicional_vaga_simples: Number.parseFloat(data.valor_adicional_vaga_simples) || 0,
      valor_adicional_vaga_dupla: Number.parseFloat(data.valor_adicional_vaga_dupla) || 0,
      valor_adicional_vaga_moto: Number.parseFloat(data.valor_adicional_vaga_moto) || 0,
      valor_adicional_hobby_box: Number.parseFloat(data.valor_adicional_hobby_box) || 0,
      // Fatores de orientação solar (8 direções)
      fator_norte: Number.parseFloat(data.fator_norte) || 1,
      fator_sul: Number.parseFloat(data.fator_sul) || 1,
      fator_leste: Number.parseFloat(data.fator_leste) || 1,
      fator_oeste: Number.parseFloat(data.fator_oeste) || 1,
      fator_nordeste: Number.parseFloat(data.fator_nordeste) || 1,
      fator_noroeste: Number.parseFloat(data.fator_noroeste) || 1,
      fator_sudeste: Number.parseFloat(data.fator_sudeste) || 1,
      fator_sudoeste: Number.parseFloat(data.fator_sudoeste) || 1,
      updated_at: new Date().toISOString(),
    }

    // Atualizar o parâmetro
    const { error } = await supabase.from("parametros_precificacao").update(parametro).eq("id", parametroId)

    if (error) {
      console.error("Erro ao atualizar parâmetro de precificação:", error)
      return { error: error.message }
    }

    // Atualizar valorizações por pavimento
    if (data.valorizacoes_pavimento) {
      // Primeiro, excluir todas as valorizações existentes
      const { error: errorDelete } = await supabase
        .from("valorizacao_pavimentos")
        .delete()
        .eq("parametro_id", parametroId)

      if (errorDelete) {
        console.error("Erro ao excluir valorizações por pavimento:", errorDelete)
        // Não falhar completamente se houver erro nas valorizações
      }

      // Depois, inserir as novas valorizações para todos os pavimentos de 0 a 20
      const valorizacoes = []
      for (let i = 0; i <= 20; i++) {
        const valorPavimento = data.valorizacoes_pavimento.find((v) => v.pavimento === i)
        valorizacoes.push({
          parametro_id: parametroId,
          pavimento: i,
          percentual: valorPavimento ? valorPavimento.percentual : 0,
        })
      }

      const { error: errorValorizacoes } = await supabase.from("valorizacao_pavimentos").insert(valorizacoes)

      if (errorValorizacoes) {
        console.error("Erro ao inserir valorizações por pavimento:", errorValorizacoes)
        // Não falhar completamente se houver erro nas valorizações
      }
    }

    // Tentar registrar atividade
    try {
      await supabase.rpc("registrar_atividade", {
        p_usuario_id: session.user.id,
        p_modulo: "empreendimentos",
        p_acao: "editar",
        p_descricao: `Atualização do parâmetro de precificação ${data.nome}`,
        p_entidade_tipo: "parametros_precificacao",
        p_entidade_id: parametroId,
        p_dados: parametro,
        p_ip_address: "127.0.0.1",
      })
    } catch (activityError) {
      console.error("Erro ao registrar atividade (não crítico):", activityError)
    }

    // Revalidar o cache
    revalidatePath(`/empreendimentos/${parametroAtual.empreendimento_id}/parametros`)

    return { id: parametroId }
  } catch (error: any) {
    console.error("Erro ao atualizar parâmetro de precificação:", error)
    return { error: error.message || "Erro ao atualizar parâmetro de precificação" }
  }
}

export async function excluirParametroPrecificacao(id: string) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Usuário não autenticado" }
  }

  try {
    // Buscar o empreendimento_id do parâmetro
    const { data: parametro, error: errorBusca } = await supabase
      .from("parametros_precificacao")
      .select("empreendimento_id, nome")
      .eq("id", id)
      .single()

    if (errorBusca) {
      return { error: "Parâmetro não encontrado" }
    }

    // Excluir o parâmetro
    const { error } = await supabase.from("parametros_precificacao").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir parâmetro de precificação:", error)
      return { error: error.message }
    }

    // Tentar registrar atividade
    try {
      await supabase.rpc("registrar_atividade", {
        p_usuario_id: session.user.id,
        p_modulo: "empreendimentos",
        p_acao: "excluir",
        p_descricao: `Exclusão do parâmetro de precificação ${parametro.nome}`,
        p_entidade_tipo: "parametros_precificacao",
        p_entidade_id: id,
        p_dados: { id },
        p_ip_address: "127.0.0.1",
      })
    } catch (activityError) {
      console.error("Erro ao registrar atividade (não crítico):", activityError)
    }

    // Revalidar o cache
    revalidatePath(`/empreendimentos/${parametro.empreendimento_id}/parametros`)

    return { success: true }
  } catch (error: any) {
    console.error("Erro ao excluir parâmetro de precificação:", error)
    return { error: error.message || "Erro ao excluir parâmetro de precificação" }
  }
}

export async function clonarParametroPrecificacao(id: string, novoNome: string) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Usuário não autenticado" }
  }

  try {
    // Buscar o parâmetro original
    const { data: parametroOriginal, error: errorBusca } = await supabase
      .from("parametros_precificacao")
      .select("*")
      .eq("id", id)
      .single()

    if (errorBusca) {
      return { error: "Parâmetro não encontrado" }
    }

    // Criar um novo objeto com os dados do parâmetro original, alterando o nome e removendo o ID
    const { id: _, ...parametroNovo } = parametroOriginal
    const novoParametro = {
      ...parametroNovo,
      nome: novoNome,
      ativo: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Inserir o novo parâmetro
    const { data: novoParametroInserido, error: errorInsert } = await supabase
      .from("parametros_precificacao")
      .insert([novoParametro])
      .select("id")
      .single()

    if (errorInsert) {
      console.error("Erro ao criar parâmetro clonado:", errorInsert)
      return { error: errorInsert.message }
    }

    // Buscar valorizações por pavimento do parâmetro original
    const { data: valorizacoesOriginais, error: errorValorizacoes } = await supabase
      .from("valorizacao_pavimentos")
      .select("*")
      .eq("parametro_id", id)

    if (errorValorizacoes) {
      console.error("Erro ao buscar valorizações originais:", errorValorizacoes)
      // Não falhar completamente se houver erro nas valorizações
    } else if (valorizacoesOriginais && valorizacoesOriginais.length > 0) {
      // Inserir valorizações para o novo parâmetro
      const novasValorizacoes = valorizacoesOriginais.map((valorizacao) => {
        const { id: _, ...valorizacaoNova } = valorizacao
        return {
          ...valorizacaoNova,
          parametro_id: novoParametroInserido.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      })

      const { error: errorInsertValorizacoes } = await supabase.from("valorizacao_pavimentos").insert(novasValorizacoes)

      if (errorInsertValorizacoes) {
        console.error("Erro ao inserir valorizações clonadas:", errorInsertValorizacoes)
        // Não falhar completamente se houver erro nas valorizações
      }
    }

    // Tentar registrar atividade
    try {
      await supabase.rpc("registrar_atividade", {
        p_usuario_id: session.user.id,
        p_modulo: "empreendimentos",
        p_acao: "clonar",
        p_descricao: `Clonação do parâmetro de precificação ${parametroOriginal.nome} para ${novoNome}`,
        p_entidade_tipo: "parametros_precificacao",
        p_entidade_id: novoParametroInserido.id,
        p_dados: { original_id: id, novo_nome: novoNome },
        p_ip_address: "127.0.0.1",
      })
    } catch (activityError) {
      console.error("Erro ao registrar atividade (não crítico):", activityError)
    }

    // Revalidar o cache
    revalidatePath(`/empreendimentos/${parametroOriginal.empreendimento_id}/parametros`)

    return { id: novoParametroInserido.id }
  } catch (error: any) {
    console.error("Erro ao clonar parâmetro de precificação:", error)
    return { error: error.message || "Erro ao clonar parâmetro de precificação" }
  }
}

export async function atualizarFatorPavimento(id: string, data: FatorPavimentoFormValues) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Usuário não autenticado" }
  }

  try {
    // Atualizar o fator de pavimento
    const { error } = await supabase
      .from("fatores_pavimento")
      .update({
        fator: Number.parseFloat(data.fator),
        descricao: data.descricao || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Erro ao atualizar fator de pavimento:", error)
      return { error: error.message }
    }

    // Buscar parametro_id para revalidar o cache
    const { data: fatorPavimento, error: errorFator } = await supabase
      .from("fatores_pavimento")
      .select("parametro_id")
      .eq("id", id)
      .single()

    if (errorFator) {
      console.error("Erro ao buscar parametro_id:", errorFator)
    } else {
      // Revalidar o cache
      revalidatePath(`/empreendimentos/*/parametros/${fatorPavimento.parametro_id}/fatores`)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Erro ao atualizar fator de pavimento:", error)
    return { error: error.message || "Erro ao atualizar fator de pavimento" }
  }
}

export async function configurarFatoresPavimento(parametroId: string) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Usuário não autenticado" }
  }

  try {
    // Chamar a função para configurar os fatores de pavimento
    const { error } = await supabase.rpc("configurar_fatores_pavimento", {
      p_parametro_id: parametroId,
    })

    if (error) {
      console.error("Erro ao configurar fatores de pavimento:", error)
      return { error: error.message }
    }

    // Revalidar o cache
    revalidatePath(`/empreendimentos/*/parametros/${parametroId}/fatores`)

    return { success: true }
  } catch (error: any) {
    console.error("Erro ao configurar fatores de pavimento:", error)
    return { error: error.message || "Erro ao configurar fatores de pavimento" }
  }
}

export async function ativarParametroPrecificacao(id: string) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Usuário não autenticado" }
  }

  try {
    // Buscar o empreendimento_id do parâmetro
    const { data: parametro, error: errorBusca } = await supabase
      .from("parametros_precificacao")
      .select("empreendimento_id, nome")
      .eq("id", id)
      .single()

    if (errorBusca) {
      return { error: "Parâmetro não encontrado" }
    }

    // Desativar outros parâmetros ativos para o mesmo empreendimento
    const { error: errorDesativar } = await supabase
      .from("parametros_precificacao")
      .update({ ativo: false })
      .eq("empreendimento_id", parametro.empreendimento_id)

    if (errorDesativar) {
      console.error("Erro ao desativar outros parâmetros:", errorDesativar)
      return { error: errorDesativar.message }
    }

    // Ativar o parâmetro selecionado
    const { error: errorAtivar } = await supabase.from("parametros_precificacao").update({ ativo: true }).eq("id", id)

    if (errorAtivar) {
      console.error("Erro ao ativar parâmetro:", errorAtivar)
      return { error: errorAtivar.message }
    }

    // Recalcular os valores de todas as unidades do empreendimento
    try {
      const { error: errorRecalculo } = await supabase.rpc("recalcular_valores_empreendimento", {
        p_empreendimento_id: parametro.empreendimento_id,
      })

      if (errorRecalculo) {
        console.error("Erro ao recalcular valores das unidades:", errorRecalculo)
        return { error: `Parâmetro ativado, mas ocorreu um erro ao recalcular os valores: ${errorRecalculo.message}` }
      }
    } catch (recalculoError: any) {
      console.error("Erro ao recalcular valores das unidades:", recalculoError)
      return { error: `Parâmetro ativado, mas ocorreu um erro ao recalcular os valores: ${recalculoError.message}` }
    }

    // Tentar registrar atividade
    try {
      await supabase.rpc("registrar_atividade", {
        p_usuario_id: session.user.id,
        p_modulo: "empreendimentos",
        p_acao: "ativar",
        p_descricao: `Ativação do parâmetro de precificação ${parametro.nome} e recálculo dos valores das unidades`,
        p_entidade_tipo: "parametros_precificacao",
        p_entidade_id: id,
        p_dados: { id },
        p_ip_address: "127.0.0.1",
      })
    } catch (activityError) {
      console.error("Erro ao registrar atividade (não crítico):", activityError)
    }

    // Revalidar o cache
    revalidatePath(`/empreendimentos/${parametro.empreendimento_id}/parametros`)
    revalidatePath(`/empreendimentos/${parametro.empreendimento_id}`)
    revalidatePath(`/empreendimentos/${parametro.empreendimento_id}/unidades`)

    return { success: true }
  } catch (error: any) {
    console.error("Erro ao ativar parâmetro:", error)
    return { error: error.message || "Erro ao ativar parâmetro" }
  }
}
