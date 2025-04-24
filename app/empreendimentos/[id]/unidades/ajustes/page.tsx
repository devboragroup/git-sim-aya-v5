import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { AjustesFinosList } from "@/components/unidades/ajustes-finos-list"

interface AjustesFinosPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: AjustesFinosPageProps): Promise<Metadata> {
  const supabase = createServerClient()

  const { data: empreendimento } = await supabase.from("empreendimentos").select("nome").eq("id", params.id).single()

  if (!empreendimento) {
    return {
      title: "Empreendimento não encontrado",
    }
  }

  return {
    title: `Ajustes Finos - ${empreendimento.nome} - Simulador AYA`,
    description: `Gerenciar ajustes finos para as unidades de ${empreendimento.nome}`,
  }
}

export default async function AjustesFinosPage({ params }: AjustesFinosPageProps) {
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

  // Verificar se existe um parâmetro ativo
  const { data: parametroAtivo } = await supabase
    .from("parametros_precificacao")
    .select("id")
    .eq("empreendimento_id", params.id)
    .eq("ativo", true)
    .single()

  const temParametroAtivo = !!parametroAtivo

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
        heading="Ajustes Finos"
        text={`Gerenciar ajustes finos para as unidades de ${empreendimento.nome}`}
      />

      {temParametroAtivo ? (
        <AjustesFinosList empreendimentoId={params.id} />
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px] bg-gray-900 border border-gray-800 rounded-lg">
          <h3 className="text-xl font-medium text-white mb-2">Nenhum parâmetro de precificação ativo</h3>
          <p className="text-gray-400 mb-6 text-center max-w-md">
            É necessário ativar um parâmetro de precificação antes de realizar ajustes finos nas unidades.
          </p>
          <Button className="bg-aya-green hover:bg-opacity-90" asChild>
            <Link href={`/empreendimentos/${params.id}/parametros`}>Gerenciar Parâmetros</Link>
          </Button>
        </div>
      )}
    </DashboardShell>
  )
}
