"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

interface AjusteFinoParams {
  unidadeId: string
  percentual: number
  motivo: string | null
}

export async function aplicarAjusteFino({ unidadeId, percentual, motivo }: AjusteFinoParams) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Usuário não autenticado" }
  }

  try {
    // Buscar dados da unidade para obter o empreendimento_id
    const { data: unidade, error: errorUnidade } = await supabase
      .from("unidades")
      .select("empreendimento_id, identificador")
      .eq("id", unidadeId)
      .single()

    if (errorUnidade || !unidade) {
      return { error: "Unidade não encontrada" }
    }

    // Verificar se existe um parâmetro ativo para o empreendimento
    const { data: parametroAtivo, error: errorParametro } = await supabase
      .from("parametros_precificacao")
      .select("id")
      .eq("empreendimento_id", unidade.empreendimento_id)
      .eq("ativo", true)
      .single()

    if (errorParametro || !parametroAtivo) {
      return { error: "Não há parâmetro de precificação ativo para este empreendimento" }
    }

    // Chamar a função SQL para aplicar o ajuste fino
    const { error } = await supabase.rpc("aplicar_ajuste_fino", {
      p_unidade_id: unidadeId,
      p_percentual: percentual,
      p_motivo: motivo || "",
      p_usuario_id: session.user.id,
    })

    if (error) {
      console.error("Erro ao aplicar ajuste fino:", error)
      return { error: error.message }
    }

    // Tentar registrar atividade
    try {
      await supabase.rpc("registrar_atividade", {
        p_usuario_id: session.user.id,
        p_modulo: "unidades",
        p_acao: "ajuste_fino",
        p_descricao: `Aplicação de ajuste fino de ${percentual}% na unidade ${unidade.identificador}`,
        p_entidade_tipo: "unidades",
        p_entidade_id: unidadeId,
        p_dados: { percentual, motivo },
        p_ip_address: "127.0.0.1",
      })
    } catch (activityError) {
      console.error("Erro ao registrar atividade (não crítico):", activityError)
    }

    // Revalidar o cache
    revalidatePath(`/empreendimentos/${unidade.empreendimento_id}/unidades/ajustes`)
    revalidatePath(`/empreendimentos/${unidade.empreendimento_id}/unidades`)

    return { success: true }
  } catch (error: any) {
    console.error("Erro ao aplicar ajuste fino:", error)
    return { error: error.message || "Erro ao aplicar ajuste fino" }
  }
}
