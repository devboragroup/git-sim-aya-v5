"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

interface UnidadeImportacao {
  identificador: string
  tipo: string
  area_privativa: number
  area_total?: number
  pavimento?: number
  dormitorios?: number
  suites?: number
  vagas?: number
  orientacao_solar?: string
  status?: string
  [key: string]: any
}

export async function importarUnidades(empreendimentoId: string, unidades: UnidadeImportacao[]) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect("/login")
  }

  // Verificar se o usuário tem permissão para editar o empreendimento
  const { data: permissao, error: permissaoError } = await supabase.rpc("usuario_tem_permissao", {
    p_usuario_id: session.user.id,
    p_modulo: "empreendimentos",
    p_acao: "editar",
    p_recurso_id: empreendimentoId,
  })

  if (permissaoError || !permissao) {
    return { error: "Sem permissão para importar unidades" }
  }

  // Verificar se o empreendimento existe
  const { data: empreendimento, error: empreendimentoError } = await supabase
    .from("empreendimentos")
    .select("id")
    .eq("id", empreendimentoId)
    .single()

  if (empreendimentoError || !empreendimento) {
    return { error: "Empreendimento não encontrado" }
  }

  let sucesso = 0
  let falhas = 0

  // Processar cada unidade
  for (const unidade of unidades) {
    try {
      // Verificar se já existe uma unidade com o mesmo identificador
      const { data: unidadeExistente } = await supabase
        .from("unidades")
        .select("id")
        .eq("empreendimento_id", empreendimentoId)
        .eq("identificador", unidade.identificador)
        .single()

      if (unidadeExistente) {
        // Se já existe, atualiza
        const { error: updateError } = await supabase
          .from("unidades")
          .update({
            tipo: unidade.tipo,
            area_privativa: unidade.area_privativa,
            area_total: unidade.area_total || null,
            pavimento: unidade.pavimento || null,
            dormitorios: unidade.dormitorios || null,
            suites: unidade.suites || null,
            vagas: unidade.vagas || null,
            orientacao_solar: unidade.orientacao_solar || null,
            status: unidade.status || "disponivel",
            updated_at: new Date().toISOString(),
          })
          .eq("id", unidadeExistente.id)

        if (updateError) {
          console.error(`Erro ao atualizar unidade ${unidade.identificador}:`, updateError)
          falhas++
          continue
        }
      } else {
        // Se não existe, insere
        const { error: insertError } = await supabase.from("unidades").insert({
          empreendimento_id: empreendimentoId,
          identificador: unidade.identificador,
          tipo: unidade.tipo,
          area_privativa: unidade.area_privativa,
          area_total: unidade.area_total || null,
          pavimento: unidade.pavimento || null,
          dormitorios: unidade.dormitorios || null,
          suites: unidade.suites || null,
          vagas: unidade.vagas || null,
          orientacao_solar: unidade.orientacao_solar || null,
          status: unidade.status || "disponivel",
        })

        if (insertError) {
          console.error(`Erro ao inserir unidade ${unidade.identificador}:`, insertError)
          falhas++
          continue
        }
      }

      // Registrar atividade
      await supabase.rpc("registrar_atividade", {
        p_usuario_id: session.user.id,
        p_modulo: "unidades",
        p_acao: "importar",
        p_descricao: `Importação da unidade ${unidade.identificador}`,
        p_entidade_tipo: "empreendimentos",
        p_entidade_id: empreendimentoId,
        p_dados: unidade,
      })

      sucesso++
    } catch (error) {
      console.error(`Erro ao processar unidade ${unidade.identificador}:`, error)
      falhas++
    }
  }

  // Recalcular valores das unidades
  try {
    await supabase.rpc("recalcular_valores_empreendimento", {
      p_empreendimento_id: empreendimentoId,
      p_usuario_id: session.user.id,
    })
  } catch (error) {
    console.error("Erro ao recalcular valores:", error)
  }

  // Revalidar o cache das páginas
  revalidatePath(`/empreendimentos/${empreendimentoId}`)
  revalidatePath(`/empreendimentos/${empreendimentoId}/unidades`)

  return { sucesso, falhas }
}
