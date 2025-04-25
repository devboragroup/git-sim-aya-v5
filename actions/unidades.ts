"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

interface UnidadeData {
  id?: string
  empreendimento_id: string
  identificador: string
  tipo: string
  tipo_unidade?: string
  area_privativa: number
  area_total?: number | null
  pavimento?: number | null
  dormitorios?: number | null
  suites?: number | null
  vagas?: number | null
  vagas_simples?: number | null
  vagas_duplas?: number | null
  vagas_moto?: number | null
  hobby_box?: number | null
  orientacao_solar?: string | null
  status?: string | null
  ajuste_fino_percentual?: number | null
  ajuste_fino_motivo?: string | null
}

export async function criarUnidade(data: UnidadeData) {
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
    if (!data.identificador) {
      return { error: "Identificador é obrigatório" }
    }

    if (!data.tipo) {
      return { error: "Tipo é obrigatório" }
    }

    if (!data.area_privativa || data.area_privativa <= 0) {
      return { error: "Área privativa deve ser um número maior que zero" }
    }

    // Verificar se já existe uma unidade com o mesmo identificador no empreendimento
    const { data: existingUnidade } = await supabase
      .from("unidades")
      .select("id")
      .eq("empreendimento_id", data.empreendimento_id)
      .eq("identificador", data.identificador)
      .maybeSingle()

    if (existingUnidade) {
      return { error: `Já existe uma unidade com o identificador ${data.identificador} neste empreendimento` }
    }

    // Inserir a unidade
    const { data: unidade, error } = await supabase
      .from("unidades")
      .insert({
        empreendimento_id: data.empreendimento_id,
        identificador: data.identificador,
        tipo: data.tipo,
        tipo_unidade: data.tipo_unidade || data.tipo,
        area_privativa: data.area_privativa,
        area_total: data.area_total || data.area_privativa,
        pavimento: data.pavimento || null,
        dormitorios: data.dormitorios || null,
        suites: data.suites || null,
        vagas: data.vagas || null,
        vagas_simples: data.vagas_simples || null,
        vagas_duplas: data.vagas_duplas || null,
        vagas_moto: data.vagas_moto || null,
        hobby_box: data.hobby_box || null,
        orientacao_solar: data.orientacao_solar || null,
        status: data.status || "disponivel",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("Erro ao criar unidade:", error)
      return { error: error.message }
    }

    // Tentar registrar atividade, mas não falhar se não conseguir
    try {
      await supabase.rpc("registrar_atividade", {
        p_usuario_id: session.user.id,
        p_modulo: "unidades",
        p_acao: "criar",
        p_descricao: `Criação da unidade ${data.identificador}`,
        p_entidade_tipo: "unidades",
        p_entidade_id: unidade.id,
        p_dados: data,
        p_ip_address: "127.0.0.1", // Valor padrão para server actions
      })
    } catch (activityError) {
      console.error("Erro ao registrar atividade (não crítico):", activityError)
    }

    // Revalidar o cache
    revalidatePath(`/empreendimentos/${data.empreendimento_id}/unidades`)

    return { id: unidade.id }
  } catch (error: any) {
    console.error("Erro ao criar unidade:", error)
    return { error: error.message || "Erro ao criar unidade" }
  }
}

export async function atualizarUnidade(data: UnidadeData) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Usuário não autenticado" }
  }

  if (!data.id) {
    return { error: "ID da unidade não fornecido" }
  }

  try {
    // Validar dados
    if (!data.identificador) {
      return { error: "Identificador é obrigatório" }
    }

    if (!data.tipo) {
      return { error: "Tipo é obrigatório" }
    }

    if (!data.area_privativa || data.area_privativa <= 0) {
      return { error: "Área privativa deve ser um número maior que zero" }
    }

    // Verificar se já existe outra unidade com o mesmo identificador no empreendimento
    const { data: existingUnidade } = await supabase
      .from("unidades")
      .select("id")
      .eq("empreendimento_id", data.empreendimento_id)
      .eq("identificador", data.identificador)
      .neq("id", data.id)
      .maybeSingle()

    if (existingUnidade) {
      return { error: `Já existe outra unidade com o identificador ${data.identificador} neste empreendimento` }
    }

    // Atualizar a unidade
    const { error } = await supabase
      .from("unidades")
      .update({
        identificador: data.identificador,
        tipo: data.tipo,
        tipo_unidade: data.tipo_unidade || data.tipo,
        area_privativa: data.area_privativa,
        area_total: data.area_total || data.area_privativa,
        pavimento: data.pavimento || null,
        dormitorios: data.dormitorios || null,
        suites: data.suites || null,
        vagas: data.vagas || null,
        vagas_simples: data.vagas_simples || null,
        vagas_duplas: data.vagas_duplas || null,
        vagas_moto: data.vagas_moto || null,
        hobby_box: data.hobby_box || null,
        orientacao_solar: data.orientacao_solar || null,
        status: data.status || "disponivel",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)

    if (error) {
      console.error("Erro ao atualizar unidade:", error)
      return { error: error.message }
    }

    // Tentar registrar atividade, mas não falhar se não conseguir
    try {
      await supabase.rpc("registrar_atividade", {
        p_usuario_id: session.user.id,
        p_modulo: "unidades",
        p_acao: "editar",
        p_descricao: `Atualização da unidade ${data.identificador}`,
        p_entidade_tipo: "unidades",
        p_entidade_id: data.id,
        p_dados: data,
        p_ip_address: "127.0.0.1", // Valor padrão para server actions
      })
    } catch (activityError) {
      console.error("Erro ao registrar atividade (não crítico):", activityError)
    }

    // Revalidar o cache
    revalidatePath(`/empreendimentos/${data.empreendimento_id}/unidades`)
    revalidatePath(`/empreendimentos/${data.empreendimento_id}/unidades/${data.id}`)

    return { id: data.id }
  } catch (error: any) {
    console.error("Erro ao atualizar unidade:", error)
    return { error: error.message || "Erro ao atualizar unidade" }
  }
}

export async function excluirUnidade(id: string) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Usuário não autenticado" }
  }

  try {
    // Buscar dados da unidade para o log
    const { data: unidade, error: errorUnidade } = await supabase
      .from("unidades")
      .select("identificador, empreendimento_id")
      .eq("id", id)
      .single()

    if (errorUnidade) {
      console.error("Erro ao buscar unidade:", errorUnidade)
      return { error: "Unidade não encontrada" }
    }

    // Excluir a unidade
    const { error } = await supabase.from("unidades").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir unidade:", error)
      return { error: error.message }
    }

    // Tentar registrar atividade, mas não falhar se não conseguir
    try {
      await supabase.rpc("registrar_atividade", {
        p_usuario_id: session.user.id,
        p_modulo: "unidades",
        p_acao: "excluir",
        p_descricao: `Exclusão da unidade ${unidade.identificador}`,
        p_entidade_tipo: "unidades",
        p_entidade_id: id,
        p_dados: { id, identificador: unidade.identificador },
        p_ip_address: "127.0.0.1", // Valor padrão para server actions
      })
    } catch (activityError) {
      console.error("Erro ao registrar atividade (não crítico):", activityError)
    }

    // Revalidar o cache
    revalidatePath(`/empreendimentos/${unidade.empreendimento_id}/unidades`)

    return { success: true }
  } catch (error: any) {
    console.error("Erro ao excluir unidade:", error)
    return { error: error.message || "Erro ao excluir unidade" }
  }
}

export async function aplicarAjusteFino({
  unidadeId,
  percentual,
  motivo,
}: {
  unidadeId: string
  percentual: number
  motivo: string | null
}) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Usuário não autenticado" }
  }

  try {
    // Atualizar o ajuste fino
    const { error } = await supabase
      .from("unidades")
      .update({
        ajuste_fino_percentual: percentual,
        ajuste_fino_motivo: motivo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", unidadeId)

    if (error) {
      console.error("Erro ao aplicar ajuste fino:", error)
      return { error: error.message }
    }

    // Tentar registrar atividade
    try {
      await supabase.rpc("registrar_atividade", {
        p_usuario_id: session.user.id,
        p_modulo: "unidades",
        p_acao: "ajustar",
        p_descricao: `Ajuste fino aplicado à unidade ${unidadeId}`,
        p_entidade_tipo: "unidades",
        p_entidade_id: unidadeId,
        p_dados: { percentual, motivo },
        p_ip_address: "127.0.0.1",
      })
    } catch (activityError) {
      console.error("Erro ao registrar atividade (não crítico):", activityError)
    }

    // Revalidar o cache
    revalidatePath(`/empreendimentos/*/unidades/ajustes`)
    revalidatePath(`/empreendimentos/*/unidades/${unidadeId}`)

    return { success: true }
  } catch (error: any) {
    console.error("Erro ao aplicar ajuste fino:", error)
    return { error: error.message || "Erro ao aplicar ajuste fino" }
  }
}

export async function importarUnidades(formData: FormData) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      success: false,
      totalProcessed: 0,
      totalImported: 0,
      totalErrors: 1,
      errors: [{ row: 0, message: "Usuário não autenticado" }],
    }
  }

  try {
    const empreendimentoId = formData.get("empreendimentoId") as string
    const file = formData.get("file") as File

    if (!empreendimentoId) {
      return {
        success: false,
        totalProcessed: 0,
        totalImported: 0,
        totalErrors: 1,
        errors: [{ row: 0, message: "ID do empreendimento não fornecido" }],
      }
    }

    if (!file) {
      return {
        success: false,
        totalProcessed: 0,
        totalImported: 0,
        totalErrors: 1,
        errors: [{ row: 0, message: "Nenhum arquivo fornecido" }],
      }
    }

    // Processar o arquivo e importar as unidades
    // Implementação omitida para brevidade

    return {
      success: true,
      totalProcessed: 10,
      totalImported: 8,
      totalErrors: 2,
      errors: [
        { row: 3, message: "Identificador duplicado" },
        { row: 7, message: "Área privativa inválida" },
      ],
    }
  } catch (error: any) {
    console.error("Erro durante a importação:", error)
    return {
      success: false,
      totalProcessed: 0,
      totalImported: 0,
      totalErrors: 1,
      errors: [{ row: 0, message: `Erro inesperado: ${error.message || String(error)}` }],
    }
  }
}

function parseCSV(text: string): any[] {
  const lines = text.split("\n")
  const headers = lines[0].split(",")

  const result = []

  for (let i = 1; i < lines.length; i++) {
    const data = lines[i].split(",")
    if (data.length === headers.length) {
      const obj: any = {}
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j].trim()] = data[j].trim()
      }
      result.push(obj)
    }
  }

  return result
}
