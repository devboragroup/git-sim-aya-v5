import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import { ParametrosList } from "@/components/parametros/parametros-list"

interface ParametrosPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ParametrosPageProps): Promise<Metadata> {
  const supabase = createServerClient()

  const { data: empreendimento } = await supabase.from("empreendimentos").select("nome").eq("id", params.id).single()

  if (!empreendimento) {
    return {
      title: "Empreendimento não encontrado",
    }
  }

  return {
    title: `Parâmetros de Precificação - ${empreendimento.nome} - Simulador AYA`,
    description: `Gerenciar parâmetros de precificação para ${empreendimento.nome}`,
  }
}

export default async function ParametrosPage({ params }: ParametrosPageProps) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect("/login")
  }

  // Buscar dados do empreendimento
  const { data: empreendimento, error } = await supabase
    .from("empreendimentos")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !empreendimento) {
    notFound()
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" asChild>
          <Link href={`/empreendimentos/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o Empreendimento
          </Link>
        </Button>

        <Button className="bg-aya-green hover:bg-opacity-90" asChild>
          <Link href={`/empreendimentos/${params.id}/parametros/novo`}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Parâmetro
          </Link>
        </Button>
      </div>

      <DashboardHeader
        heading="Parâmetros de Precificação"
        text={`Gerencie os parâmetros de precificação para ${empreendimento.nome}`}
      />

      <ParametrosList empreendimentoId={params.id} />
    </DashboardShell>
  )
}
