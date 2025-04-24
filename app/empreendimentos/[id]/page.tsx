import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Building2, MapPin, FileText, DollarSign, Upload } from "lucide-react"

interface EmpreendimentoPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EmpreendimentoPageProps): Promise<Metadata> {
  const supabase = createServerClient()

  const { data: empreendimento } = await supabase.from("empreendimentos").select("nome").eq("id", params.id).single()

  if (!empreendimento) {
    return {
      title: "Empreendimento não encontrado",
    }
  }

  return {
    title: `${empreendimento.nome} - Simulador AYA`,
    description: `Detalhes do empreendimento ${empreendimento.nome}`,
  }
}

export default async function EmpreendimentoPage({ params }: EmpreendimentoPageProps) {
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

  // Buscar métricas de VGV
  const { data: vgvData } = await supabase.rpc("calcular_vgv_completo", { p_empreendimento_id: params.id }).single()

  const vgv = vgvData || {
    vgv_total: 0,
    vgv_disponivel: 0,
    vgv_reservado: 0,
    vgv_vendido: 0,
    unidades_total: 0,
    unidades_disponiveis: 0,
    unidades_reservadas: 0,
    unidades_vendidas: 0,
  }

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" asChild>
          <Link href="/empreendimentos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <DashboardHeader heading={empreendimento.nome} text={empreendimento.tipo} />

      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Building2 className="mr-2 h-5 w-5 text-aya-green" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400">Endereço</h4>
                <p className="text-white flex items-center mt-1">
                  <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                  {empreendimento.endereco || "Não informado"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400">Registro</h4>
                <p className="text-white flex items-center mt-1">
                  <FileText className="mr-2 h-4 w-4 text-gray-400" />
                  {empreendimento.registro || "Não informado"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400">Descrição</h4>
                <p className="text-white mt-1">{empreendimento.descricao || "Sem descrição"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <DollarSign className="mr-2 h-5 w-5 text-aya-green" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400">VGV Bruto Alvo</h4>
                <p className="text-white text-xl mt-1">{formatCurrency(empreendimento.vgv_bruto_alvo || 0)}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400">Percentual de Permuta</h4>
                <p className="text-white text-xl mt-1">{empreendimento.percentual_permuta || 0}%</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400">VGV Calculado</h4>
                <p className="text-white text-xl mt-1">{formatCurrency(vgv.vgv_total || 0)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total de Unidades</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{vgv.unidades_total || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Unidades Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{vgv.unidades_disponiveis || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Unidades Reservadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{vgv.unidades_reservadas || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Unidades Vendidas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{vgv.unidades_vendidas || 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" asChild>
            <Link href={`/empreendimentos/${params.id}/editar`}>Editar Empreendimento</Link>
          </Button>

          <Button className="bg-aya-green hover:bg-opacity-90" asChild>
            <Link href={`/empreendimentos/${params.id}/unidades`}>Gerenciar Unidades</Link>
          </Button>

          <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" asChild>
            <Link href={`/empreendimentos/${params.id}/importar-unidades`}>
              <Upload className="mr-2 h-4 w-4" />
              Importar Unidades
            </Link>
          </Button>
        </div>
      </div>
    </DashboardShell>
  )
}
