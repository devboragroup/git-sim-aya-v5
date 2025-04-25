"use client"

import { useState, useEffect } from "react"
import { createClientClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Edit, Home } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { HistoricoAjustes } from "@/components/unidades/historico-ajustes"
import Link from "next/link"

interface UnidadeDetalhesProps {
  empreendimentoId: string
  unidadeId: string
}

interface Unidade {
  id: string
  identificador: string
  tipo: string
  tipo_unidade: string
  area_privativa: number
  area_total: number | null
  pavimento: number | null
  dormitorios: number | null
  suites: number | null
  vagas: number | null
  vagas_simples: number | null
  vagas_duplas: number | null
  vagas_moto: number | null
  hobby_box: number | null
  orientacao_solar: string | null
  fator_pavimento: number | null
  fator_ajuste_fino: number | null
  ajuste_fino_percentual: number | null
  ajuste_fino_motivo: string | null
  valor_calculado: number | null
  status: string | null
  created_at: string | null
  updated_at: string | null
}

export function UnidadeDetalhes({ empreendimentoId, unidadeId }: UnidadeDetalhesProps) {
  const [unidade, setUnidade] = useState<Unidade | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientClient()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchUnidade() {
      try {
        const { data, error } = await supabase.from("unidades").select("*").eq("id", unidadeId).single()

        if (error) {
          throw error
        }

        setUnidade(data)
      } catch (error) {
        console.error("Erro ao buscar unidade:", error)
        setError("Não foi possível carregar os dados da unidade.")
        toast({
          title: "Erro ao carregar unidade",
          description: "Não foi possível carregar os dados da unidade.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUnidade()
  }, [unidadeId, supabase, toast])

  // Formatar valores monetários
  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Obter classe de cor com base no status
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "disponivel":
        return "bg-green-100 text-green-800 border-green-200"
      case "reservado":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "vendido":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "indisponivel":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Formatar status para exibição
  const formatStatus = (status: string | null) => {
    if (!status) return "Não definido"

    const statusMap: Record<string, string> = {
      disponivel: "Disponível",
      reservado: "Reservado",
      vendido: "Vendido",
      indisponivel: "Indisponível",
    }

    return statusMap[status] || status
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-aya-green" />
      </div>
    )
  }

  if (error || !unidade) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center">
        <h3 className="text-xl font-medium text-white mb-2">Erro ao carregar unidade</h3>
        <p className="text-gray-400 mb-4">{error || "Unidade não encontrada"}</p>
        <Button className="bg-aya-green hover:bg-opacity-90" asChild>
          <Link href={`/empreendimentos/${empreendimentoId}/unidades`}>Voltar para Unidades</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="bg-gray-800 p-3 rounded-lg">
            <Home className="h-6 w-6 text-aya-green" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{unidade.identificador}</h2>
            <p className="text-gray-400">{unidade.tipo}</p>
          </div>
        </div>
        <Badge className={getStatusColor(unidade.status)}>{formatStatus(unidade.status)}</Badge>
      </div>

      <Tabs defaultValue="detalhes" className="w-full">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="detalhes" className="data-[state=active]:bg-aya-green data-[state=active]:text-white">
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="data-[state=active]:bg-aya-green data-[state=active]:text-white">
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="historico" className="data-[state=active]:bg-aya-green data-[state=active]:text-white">
            Histórico de Ajustes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="mt-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Informações da Unidade</CardTitle>
              <CardDescription className="text-gray-400">Detalhes técnicos e características</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Tipo de Unidade</h3>
                    <p className="text-white">{unidade.tipo_unidade || unidade.tipo}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Área Privativa</h3>
                    <p className="text-white">{unidade.area_privativa} m²</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Área Total</h3>
                    <p className="text-white">{unidade.area_total ? `${unidade.area_total} m²` : "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Pavimento</h3>
                    <p className="text-white">{unidade.pavimento !== null ? unidade.pavimento : "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Dormitórios</h3>
                    <p className="text-white">{unidade.dormitorios !== null ? unidade.dormitorios : "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Suítes</h3>
                    <p className="text-white">{unidade.suites !== null ? unidade.suites : "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Vagas</h3>
                    <p className="text-white">
                      {unidade.vagas_simples !== null ||
                      unidade.vagas_duplas !== null ||
                      unidade.vagas_moto !== null ? (
                        <>
                          {unidade.vagas_simples ? `${unidade.vagas_simples} simples` : ""}
                          {unidade.vagas_duplas
                            ? `${unidade.vagas_simples ? ", " : ""}${unidade.vagas_duplas} duplas`
                            : ""}
                          {unidade.vagas_moto
                            ? `${unidade.vagas_simples || unidade.vagas_duplas ? ", " : ""}${unidade.vagas_moto} moto`
                            : ""}
                        </>
                      ) : unidade.vagas !== null ? (
                        unidade.vagas
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Orientação Solar</h3>
                    <p className="text-white">{unidade.orientacao_solar || "N/A"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Informações Financeiras</CardTitle>
              <CardDescription className="text-gray-400">Valores e fatores de precificação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Valor Calculado</h3>
                    <p className="text-xl font-bold text-white">{formatCurrency(unidade.valor_calculado)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Valor por m²</h3>
                    <p className="text-white">
                      {unidade.valor_calculado && unidade.area_privativa
                        ? formatCurrency(unidade.valor_calculado / unidade.area_privativa)
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Fator de Pavimento</h3>
                    <p className="text-white">
                      {unidade.fator_pavimento ? `${unidade.fator_pavimento.toFixed(2)}x` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Ajuste Fino</h3>
                    <p
                      className={`${
                        unidade.ajuste_fino_percentual
                          ? unidade.ajuste_fino_percentual > 0
                            ? "text-green-500"
                            : unidade.ajuste_fino_percentual < 0
                              ? "text-red-500"
                              : "text-white"
                          : "text-white"
                      }`}
                    >
                      {unidade.ajuste_fino_percentual !== null
                        ? `${unidade.ajuste_fino_percentual > 0 ? "+" : ""}${unidade.ajuste_fino_percentual}%`
                        : "0%"}
                    </p>
                    {unidade.ajuste_fino_motivo && (
                      <p className="text-sm text-gray-400 mt-1">{unidade.ajuste_fino_motivo}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <HistoricoAjustes unidadeId={unidadeId} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" asChild>
          <Link href={`/empreendimentos/${empreendimentoId}/unidades`}>Voltar para Unidades</Link>
        </Button>
        <Button className="bg-aya-green hover:bg-opacity-90" asChild>
          <Link href={`/empreendimentos/${empreendimentoId}/unidades/${unidadeId}/editar`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Unidade
          </Link>
        </Button>
      </div>
    </div>
  )
}
