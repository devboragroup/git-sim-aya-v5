import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { EmpreendimentoForm } from "@/components/empreendimentos/empreendimento-form"

export const metadata: Metadata = {
  title: "Novo Empreendimento - Simulador AYA",
  description: "Cadastre um novo empreendimento imobiliário",
}

export default async function NovoEmpreendimentoPage() {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect("/login")
  }

  // Verificar se o usuário tem permissão para criar empreendimentos
  const { data: permissao } = await supabase.rpc("usuario_tem_permissao", {
    p_usuario_id: session.user.id,
    p_modulo: "empreendimentos",
    p_acao: "criar",
  })

  if (!permissao) {
    redirect("/dashboard?error=Sem permissão para criar empreendimentos")
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Novo Empreendimento" text="Cadastre um novo empreendimento imobiliário no sistema." />
      <div className="grid gap-6">
        <EmpreendimentoForm />
      </div>
    </DashboardShell>
  )
}
