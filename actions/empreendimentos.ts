"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

interface EmpreendimentoData {
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
    redirect("/login")
  }

  // Verificar se o usuário tem permissão para criar empreendimentos
  const { data: permissao, error: permissaoError } = await supabase.rpc("usuario_tem_permissao", {
    p_usuario_id: session.user.id,
    p_modulo: "empreendimentos",
    p_acao: "criar",
  })

  if (permissaoError || !permissao) {
    return { error: "Sem permissão para criar empreendimentos" }
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
    })
    .select("id")
    .single()

  if (error) {
    console.error("Erro ao criar empreendimento:", error)
    return { error: error.message }
  }

  // Registrar atividade
  await supabase.rpc("registrar_atividade", {
    p_usuario_id: session.user.id,
    p_modulo: "empreendimentos",
    p_acao: "criar",
    p_descricao: `Criação do empreendimento ${data.nome}`,
    p_entidade_tipo: "empreendimentos",
    p_entidade_id: empreendimento.id,
    p_dados: data,
  })

  // Revalidar o cache da página de empreendimentos
  revalidatePath("/empreendimentos")

  return { id: empreendimento.id }
}
