import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { EmpreendimentoForm } from "@/components/empreendimentos/empreendimento-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface EditarEmpreendimentoPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditarEmpreendimentoPageProps): Promise<Metadata> {
  const supabase = createServerClient()

  const { data: empreendimento } = await supabase.from("empreendimentos").select("nome").eq("id", params.id).single()

  if (!empreendimento) {
    return {
      title: "Empreendimento não encontrado",
    }
  }

  return {
    title: `Editar ${empreendimento.nome} - Simulador AYA`,
    description: `Editar informações do empreendimento ${empreendimento.nome}`,
  }
}

export default async function EditarEmpreendimentoPage({ params }: EditarEmpreendimentoPageProps) {
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
      </div>

      <DashboardHeader heading={`Editar ${empreendimento.nome}`} text="Atualize as informações do empreendimento" />

      <div className="grid gap-6">
        <EmpreendimentoForm empreendimento={empreendimento} />
      </div>
    </DashboardShell>
  )
}
