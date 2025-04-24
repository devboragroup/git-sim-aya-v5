import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ImportacaoUnidades } from "@/components/unidades/importacao-unidades"

interface ImportarUnidadesPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ImportarUnidadesPageProps): Promise<Metadata> {
  const supabase = createServerClient()

  const { data: empreendimento } = await supabase.from("empreendimentos").select("nome").eq("id", params.id).single()

  if (!empreendimento) {
    return {
      title: "Empreendimento não encontrado",
    }
  }

  return {
    title: `Importar Unidades - ${empreendimento.nome} - Simulador AYA`,
    description: `Importação de unidades para o empreendimento ${empreendimento.nome}`,
  }
}

export default async function ImportarUnidadesPage({ params }: ImportarUnidadesPageProps) {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect("/login")
  }

  // Verificar se o usuário tem permissão para editar o empreendimento
  const { data: permissao } = await supabase.rpc("usuario_tem_permissao", {
    p_usuario_id: session.user.id,
    p_modulo: "empreendimentos",
    p_acao: "editar",
    p_recurso_id: params.id,
  })

  if (!permissao) {
    redirect(`/empreendimentos/${params.id}?error=Sem permissão para importar unidades`)
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
      </div>

      <DashboardHeader
        heading={`Importar Unidades - ${empreendimento.nome}`}
        text="Importe unidades a partir de um arquivo CSV ou Excel (.xlsx)"
      />

      <ImportacaoUnidades empreendimentoId={params.id} />
    </DashboardShell>
  )
}
