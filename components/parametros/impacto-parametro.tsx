"use client"

import { useState, useEffect } from "react"
import { createClientClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

interface ImpactoParametroProps {
  parametroId: string
  empreendimentoId: string
}

interface ValorUnidade {
  identificador: string
  valor_atual: number
  valor_simulado: number
  diferenca: number
  diferenca_percentual: number
}

export function ImpactoParametro({ parametroId, empreendimentoId }: ImpactoParametroProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [valoresUnidades, setValoresUnidades] = useState<ValorUnidade[]>([])
  const [resumo, setResumo] = useState({
    total_atual: 0,
    total_simulado: 0,
    diferenca: 0,
    diferenca_percentual: 0,
    maior_aumento: { identificador: "", valor: 0 },
    maior_reducao: { identificador: "", valor: 0 },
  })
  const supabase = createClientClient()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchImpacto() {
      try {
        // Buscar valores atuais das unidades
        const { data: unidades, error: errorUnidades } = await supabase
          .from("unidades")
          .select("id, identificador, valor_calculado")
          .eq("empreendimento_id", empreendimentoId)
          .order("identificador", { ascending: true })

        if (errorUnidades || !unidades) {
          throw new Error("Erro ao buscar unidades")
        }

        // Simular valores com o parâmetro selecionado
        const { data: simulacao, error: errorSimulacao } = await supabase.rpc("simular_valores_parametro", {
          p_parametro_id: parametroId,
        })

        if (errorSimulacao) {
          throw new Error("Erro ao simular valores")
        }

        // Processar os dados para exibição
        const valoresProcessados = unidades.map((unidade) => {
          const simulado = simulacao.find((s: any) => s.unidade_id === unidade.id)
          const valorAtual = unidade.valor_calculado || 0
          const valorSimulado = simulado?.valor_simulado || 0
          const diferenca = valorSimulado - valorAtual
          const diferenca_percentual = valorAtual > 0 ? (diferenca / valorAtual) * 100 : 0

          return {
            identificador: unidade.identificador,
            valor_atual: valorAtual,
            valor_simulado: valorSimulado,
            diferenca,
            diferenca_percentual,
          }
        })

        setValoresUnidades(valoresProcessados)

        // Calcular resumo
        const totalAtual = valoresProcessados.reduce((sum, item) => sum + item.valor_atual, 0)
        const totalSimulado = valoresProcessados.reduce((sum, item) => sum + item.valor_simulado, 0)
        const diferenca = totalSimulado - totalAtual
        const diferencaPercentual = totalAtual > 0 ? (diferenca / totalAtual) * 100 : 0

        // Encontrar maior aumento e redução
        let maiorAumento = { identificador: "", valor: 0 }
        let maiorReducao = { identificador: "", valor: 0 }

        valoresProcessados.forEach((item) => {
          if (item.diferenca_percentual > maiorAumento.valor) {
            maiorAumento = { identificador: item.identificador, valor: item.diferenca_percentual }
          }
          if (item.diferenca_percentual < maiorReducao.valor) {
            maiorReducao = { identificador: item.identificador, valor: item.diferenca_percentual }
          }
        })

        setResumo({
          total_atual: totalAtual,
          total_simulado: totalSimulado,
          diferenca,
          diferenca_percentual: diferencaPercentual,
          maior_aumento: maiorAumento,
          maior_reducao: maiorReducao,
        })
      } catch (error) {
        console.error("Erro ao buscar impacto:", error)
        toast({
          title: "Erro ao carregar impacto",
          description: "Não foi possível carregar os dados de impacto do parâmetro.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchImpacto()
  }, [parametroId, empreendimentoId, supabase, toast])

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Formatar percentuais
  const formatPercent = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-aya-green" />
      </div>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Análise de Impacto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400">VGV Total Atual</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(resumo.total_atual)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400">VGV Total Simulado</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(resumo.total_simulado)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`${resumo.diferenca >= 0 ? "bg-green-900/30" : "bg-red-900/30"} border-gray-700`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400">Impacto no VGV</p>
                  <p className="text-xl font-bold text-white flex items-center">
                    {resumo.diferenca >= 0 ? (
                      <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="mr-2 h-5 w-5 text-red-500" />
                    )}
                    {formatCurrency(resumo.diferenca)} ({formatPercent(resumo.diferenca_percentual)})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="grafico" className="w-full">
          <TabsList className="bg-gray-800">
            <TabsTrigger value="grafico" className="data-[state=active]:bg-aya-green data-[state=active]:text-white">
              Gráfico
            </TabsTrigger>
            <TabsTrigger value="tabela" className="data-[state=active]:bg-aya-green data-[state=active]:text-white">
              Tabela
            </TabsTrigger>
          </TabsList>
          <TabsContent value="grafico" className="mt-4">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={valoresUnidades.slice(0, 20)} // Limitar para melhor visualização
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis
                    dataKey="identificador"
                    stroke="#888"
                    angle={-45}
                    textAnchor="end"
                    tick={{ fill: "#888", fontSize: 12 }}
                    height={70}
                  />
                  <YAxis stroke="#888" tick={{ fill: "#888" }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: "#333", border: "1px solid #555" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Legend />
                  <Bar dataKey="valor_atual" name="Valor Atual" fill="#8884d8" />
                  <Bar dataKey="valor_simulado" name="Valor Simulado" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-[300px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={valoresUnidades.slice(0, 20)} // Limitar para melhor visualização
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis
                    dataKey="identificador"
                    stroke="#888"
                    angle={-45}
                    textAnchor="end"
                    tick={{ fill: "#888", fontSize: 12 }}
                    height={70}
                  />
                  <YAxis stroke="#888" tick={{ fill: "#888" }} />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                    contentStyle={{ backgroundColor: "#333", border: "1px solid #555" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="diferenca_percentual"
                    name="Variação (%)"
                    stroke="#ff7300"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="tabela" className="mt-4">
            <div className="rounded-md border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="p-2 text-left text-gray-400">Unidade</th>
                    <th className="p-2 text-right text-gray-400">Valor Atual</th>
                    <th className="p-2 text-right text-gray-400">Valor Simulado</th>
                    <th className="p-2 text-right text-gray-400">Diferença</th>
                    <th className="p-2 text-right text-gray-400">Variação</th>
                  </tr>
                </thead>
                <tbody>
                  {valoresUnidades.map((unidade, index) => (
                    <tr key={index} className="border-t border-gray-800 hover:bg-gray-800/50">
                      <td className="p-2 text-white">{unidade.identificador}</td>
                      <td className="p-2 text-right text-white">{formatCurrency(unidade.valor_atual)}</td>
                      <td className="p-2 text-right text-white">{formatCurrency(unidade.valor_simulado)}</td>
                      <td className="p-2 text-right text-white">{formatCurrency(unidade.diferenca)}</td>
                      <td
                        className={`p-2 text-right ${unidade.diferenca_percentual >= 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {formatPercent(unidade.diferenca_percentual)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
