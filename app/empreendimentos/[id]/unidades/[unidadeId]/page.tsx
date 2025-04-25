import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { UnidadeDetalhes } from "@/components/unidades/unidade-detalhes"

interface UnidadePageProps {
  params: {
    id: string
    unidadeId: string
  }
}

export async function generateMetadata({ params }: UnidadePageProps): Promise<Metadata> {
  const supabase = createServerClient()

  const { data: unidade } = await supabase
    .from("unidades")
    .select("identificador, empreendimento_id")
    .eq("id", params.unidadeId)
    .single()

  if (!unidade) {
    return {
      title: "Unidade não encontrada",
    }
  }

  const { data: empreendimento } = await supabase
    .from("empreendimentos")
    .select("nome")
    .eq("id", unidade.empreendimento_id)
    .single()

  return {
    title: `${unidade.identificador} - ${empreendimento?.nome || "Empreendimento"} - Simulador AYA`,
    description: `Detalhes da unidade ${unidade.identificador}`,
  }
}

export default async function UnidadePage({ params }: UnidadePageProps) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect("/login")
  }

  // Buscar dados da unidade
  const { data: unidade, error } = await supabase.from("unidades").select("*").eq("id", params.unidadeId).single()

  if (error || !unidade) {
    notFound()
  }

  // Verificar se a unidade pertence ao empreendimento
  if (unidade.empreendimento_id !== params.id) {
    notFound()
  }

  // Buscar dados do empreendimento
  const { data: empreendimento } = await supabase.from("empreendimentos").select("nome").eq("id", params.id).single()

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" asChild>
          <Link href={`/empreendimentos/${params.id}/unidades`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Unidades
          </Link>
        </Button>
      </div>

      <DashboardHeader
        heading={unidade.identificador}
        text={`Detalhes da unidade no empreendimento ${empreendimento?.nome || ""}`}
      />

      <UnidadeDetalhes empreendimentoId={params.id} unidadeId={params.unidadeId} />
    </DashboardShell>
  )
}
