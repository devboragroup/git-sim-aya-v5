import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ValorizacaoPavimentoList } from "@/components/parametros/valorizacao-pavimento-list"

interface ValorizacoesPavimentoPageProps {
  params: {
    id: string
    parametroId: string
  }
}

export async function generateMetadata({ params }: ValorizacoesPavimentoPageProps): Promise<Metadata> {
  const supabase = createServerClient()

  const { data: parametro, error } = await supabase
    .from("parametros_precificacao")
    .select("nome, empreendimento_id")
    .eq("id", params.parametroId)
    .single()

  if (error || !parametro) {
    return {
      title: "Parâmetro não encontrado",
    }
  }

  const { data: empreendimento } = await supabase
    .from("empreendimentos")
    .select("nome")
    .eq("id", parametro.empreendimento_id)
    .single()

  return {
    title: `Valorizações por Pavimento - ${parametro.nome} - ${empreendimento?.nome || "Empreendimento"} - Simulador AYA`,
    description: `Gerenciar valorizações por pavimento para o parâmetro ${parametro.nome}`,
  }
}

export default async function ValorizacoesPavimentoPage({ params }: ValorizacoesPavimentoPageProps) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect("/login")
  }

  // Buscar dados do parâmetro
  const { data: parametro, error } = await supabase
    .from("parametros_precificacao")
    .select("*")
    .eq("id", params.parametroId)
    .single()

  if (error || !parametro) {
    notFound()
  }

  // Verificar se o parâmetro pertence ao empreendimento
  if (parametro.empreendimento_id !== params.id) {
    notFound()
  }

  // Buscar dados do empreendimento
  const { data: empreendimento } = await supabase.from("empreendimentos").select("nome").eq("id", params.id).single()

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" asChild>
          <Link href={`/empreendimentos/${params.id}/parametros`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Parâmetros
          </Link>
        </Button>
      </div>

      <DashboardHeader
        heading={`Valorizações por Pavimento - ${parametro.nome}`}
        text={`Gerenciar valorizações por pavimento para ${empreendimento?.nome || "Empreendimento"}`}
      />

      <ValorizacaoPavimentoList parametroId={params.parametroId} />
    </DashboardShell>
  )
}
