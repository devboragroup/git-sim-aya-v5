"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

interface EmpreendimentoData {
  id?: string
  nome: string
  tipo: string
  endereco: string
  registro?: string
  descricao?: string
  vgv_bruto_alvo: number
  percentual_permuta: number
}

export async function criarEmpreendimento(data: EmpreendimentoData) {
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

    if (!data.tipo) {
      return { error: "Tipo é obrigatório" }
    }

    if (!data.endereco || data.endereco.length < 5) {
      return { error: "Endereço deve ter pelo menos 5 caracteres" }
    }

    if (isNaN(data.vgv_bruto_alvo) || data.vgv_bruto_alvo < 0) {
      return { error: "VGV Bruto Alvo deve ser um número válido" }
    }

    if (isNaN(data.percentual_permuta) || data.percentual_permuta < 0 || data.percentual_permuta > 100) {
      return { error: "Percentual de Permuta deve estar entre 0 e 100" }
    }

    // Inserir o empreendimento
    const { data: empreendimento, error } = await supabase
      .from("empreendimentos")
      .insert({
        nome: data.nome,
        tipo: data.tipo,
        endereco: data.endereco,
        registro: data.registro || null,
        descricao: data.descricao || null,
        vgv_bruto_alvo: data.vgv_bruto_alvo,
        percentual_permuta: data.percentual_permuta,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("Erro ao criar empreendimento:", error)
      return { error: error.message }
    }

    // Tentar registrar atividade, mas não falhar se não conseguir
    try {
      await supabase.rpc("registrar_atividade", {
        p_usuario_id: session.user.id,
        p_modulo: "empreendimentos",
        p_acao: "criar",
        p_descricao: `Criação do empreendimento ${data.nome}`,
        p_entidade_tipo: "empreendimentos",
        p_entidade_id: empreendimento.id,
        p_dados: data,
        p_ip_address: "127.0.0.1", // Valor padrão para server actions
      })
    } catch (activityError) {
      console.error("Erro ao registrar atividade (não crítico):", activityError)
    }

    // Revalidar o cache da página de empreendimentos
    revalidatePath("/empreendimentos")

    return { id: empreendimento.id }
  } catch (error: any) {
    console.error("Erro ao criar empreendimento:", error)
    return { error: error.message || "Erro ao criar empreendimento" }
  }
}

export async function atualizarEmpreendimento(data: EmpreendimentoData) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Usuário não autenticado" }
  }

  if (!data.id) {
    return { error: "ID do empreendimento não fornecido" }
  }

  try {
    // Validar dados
    if (!data.nome || data.nome.length < 3) {
      return { error: "Nome deve ter pelo menos 3 caracteres" }
    }

    if (!data.tipo) {
      return { error: "Tipo é obrigatório" }
    }

    if (!data.endereco || data.endereco.length < 5) {
      return { error: "Endereço deve ter pelo menos 5 caracteres" }
    }

    if (isNaN(data.vgv_bruto_alvo) || data.vgv_bruto_alvo < 0) {
      return { error: "VGV Bruto Alvo deve ser um número válido" }
    }

    if (isNaN(data.percentual_permuta) || data.percentual_permuta < 0 || data.percentual_permuta > 100) {
      return { error: "Percentual de Permuta deve estar entre 0 e 100" }
    }

    // Atualizar o empreendimento
    const { error } = await supabase
      .from("empreendimentos")
      .update({
        nome: data.nome,
        tipo: data.tipo,
        endereco: data.endereco,
        registro: data.registro || null,
        descricao: data.descricao || null,
        vgv_bruto_alvo: data.vgv_bruto_alvo,
        percentual_permuta: data.percentual_permuta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)

    if (error) {
      console.error("Erro ao atualizar empreendimento:", error)
      return { error: error.message }
    }

    // Tentar registrar atividade, mas não falhar se não conseguir
    try {
      await supabase.rpc("registrar_atividade", {
        p_usuario_id: session.user.id,
        p_modulo: "empreendimentos",
        p_acao: "editar",
        p_descricao: `Atualização do empreendimento ${data.nome}`,
        p_entidade_tipo: "empreendimentos",
        p_entidade_id: data.id,
        p_dados: data,
        p_ip_address: "127.0.0.1", // Valor padrão para server actions
      })
    } catch (activityError) {
      console.error("Erro ao registrar atividade (não crítico):", activityError)
    }

    // Revalidar o cache das páginas
    revalidatePath("/empreendimentos")
    revalidatePath(`/empreendimentos/${data.id}`)

    return { id: data.id }
  } catch (error: any) {
    console.error("Erro ao atualizar empreendimento:", error)
    return { error: error.message || "Erro ao atualizar empreendimento" }
  }
}

export async function excluirEmpreendimento(id: string) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Usuário não autenticado" }
  }

  try {
    // Verificar se existem unidades vinculadas
    const { count: unidadesCount, error: unidadesError } = await supabase
      .from("unidades")
      .select("id", { count: "exact", head: true })
      .eq("empreendimento_id", id)

    if (unidadesError) {
      console.error("Erro ao verificar unidades:", unidadesError)
      return { error: unidadesError.message }
    }

    if (unidadesCount && unidadesCount > 0) {
      return {
        error: "Não é possível excluir o empreendimento pois existem unidades vinculadas. Exclua as unidades primeiro.",
      }
    }

    // Buscar nome do empreendimento para o log
    const { data: empreendimento } = await supabase.from("empreendimentos").select("nome").eq("id", id).single()

    // Excluir o empreendimento
    const { error } = await supabase.from("empreendimentos").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir empreendimento:", error)
      return { error: error.message }
    }

    // Tentar registrar atividade, mas não falhar se não conseguir
    try {
      await supabase.rpc("registrar_atividade", {
        p_usuario_id: session.user.id,
        p_modulo: "empreendimentos",
        p_acao: "excluir",
        p_descricao: `Exclusão do empreendimento ${empreendimento?.nome || id}`,
        p_entidade_tipo: "empreendimentos",
        p_entidade_id: id,
        p_dados: { id },
        p_ip_address: "127.0.0.1", // Valor padrão para server actions
      })
    } catch (activityError) {
      console.error("Erro ao registrar atividade (não crítico):", activityError)
    }

    // Revalidar o cache da página de empreendimentos
    revalidatePath("/empreendimentos")

    return { success: true }
  } catch (error: any) {
    console.error("Erro ao excluir empreendimento:", error)
    return { error: error.message || "Erro ao excluir empreendimento" }
  }
}
