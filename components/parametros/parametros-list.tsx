"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Settings, Check, Sliders, BarChart2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ativarParametroPrecificacao } from "@/actions/parametros"
import { ExcluirParametroDialog } from "@/components/parametros/excluir-parametro-dialog"
import { ClonarParametroDialog } from "@/components/parametros/clonar-parametro-dialog"
import type { ParametroPrecificacao } from "@/types/parametros"

interface ParametrosListProps {
  empreendimentoId: string
}

export function ParametrosList({ empreendimentoId }: ParametrosListProps) {
  const [parametros, setParametros] = useState<ParametroPrecificacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActivating, setIsActivating] = useState<string | null>(null)
  const supabase = createClientClient()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchParametros() {
      try {
        const { data, error } = await supabase
          .from("parametros_precificacao")
          .select("*")
          .eq("empreendimento_id", empreendimentoId)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setParametros(data || [])
      } catch (error) {
        console.error("Erro ao buscar parâmetros:", error)
        toast({
          title: "Erro ao carregar parâmetros",
          description: "Não foi possível carregar os parâmetros de precificação.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchParametros()

    // Configurar subscription para atualizações em tempo real
    const channel = supabase
      .channel("parametros-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parametros_precificacao",
          filter: `empreendimento_id=eq.${empreendimentoId}`,
        },
        () => {
          fetchParametros()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [empreendimentoId, supabase, toast])

  async function handleAtivarParametro(parametroId: string) {
    setIsActivating(parametroId)

    try {
      const result = await ativarParametroPrecificacao(parametroId)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Parâmetro ativado",
        description: "O parâmetro foi ativado e os valores das unidades foram recalculados com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao ativar parâmetro",
        description: error.message || "Ocorreu um erro ao ativar o parâmetro de precificação.",
        variant: "destructive",
      })
    } finally {
      setIsActivating(null)
    }
  }

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-aya-green" />
      </div>
    )
  }

  if (parametros.length === 0) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center">
        <Settings className="h-12 w-12 text-gray-500" />
        <h3 className="mt-4 text-lg font-medium text-white">Nenhum parâmetro de precificação encontrado</h3>
        <p className="text-sm text-gray-400">Comece criando seu primeiro parâmetro de precificação.</p>
        <Button className="mt-4 bg-aya-green hover:bg-opacity-90" asChild>
          <Link href={`/empreendimentos/${empreendimentoId}/parametros/novo`}>Criar Parâmetro</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {parametros.map((parametro) => (
        <Card
          key={parametro.id}
          className={`overflow-hidden ${
            parametro.ativo ? "bg-gray-900 border-aya-green border-2" : "bg-gray-900 border-gray-800"
          }`}
        >
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">{parametro.nome}</CardTitle>
              {parametro.ativo && (
                <Badge className="bg-aya-green">
                  <Check className="mr-1 h-3 w-3" /> Ativo
                </Badge>
              )}
            </div>
            <CardDescription className="text-gray-400">{parametro.descricao || "Sem descrição"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium text-gray-400">Valor m² studio</p>
                <p className="text-white">
                  {parametro.valor_m2_studio ? formatCurrency(parametro.valor_m2_studio) : "Não definido"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Valor m² apartamento</p>
                <p className="text-white">
                  {parametro.valor_m2_apartamento ? formatCurrency(parametro.valor_m2_apartamento) : "Não definido"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium text-gray-400">Adicional por suíte</p>
                <p className="text-white">{formatCurrency(parametro.valor_adicional_suite)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Adicional por vaga simples</p>
                <p className="text-white">{formatCurrency(parametro.valor_adicional_vaga_simples)}</p>
              </div>
            </div>
            {parametro.ativo && (
              <div className="mt-2 p-2 bg-gray-800 rounded-md">
                <p className="text-sm font-medium text-aya-green mb-1">Parâmetro Ativo</p>
                <p className="text-xs text-gray-400">
                  Ativado em:{" "}
                  {new Date(parametro.updated_at || "").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-gray-400">
                  Este parâmetro está sendo usado para calcular os valores das unidades.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="flex justify-between w-full">
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" asChild>
                <Link href={`/empreendimentos/${empreendimentoId}/parametros/${parametro.id}`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" asChild>
                <Link href={`/empreendimentos/${empreendimentoId}/parametros/${parametro.id}/fatores`}>
                  <Sliders className="mr-2 h-4 w-4" />
                  Fatores
                </Link>
              </Button>
            </div>
            <div className="flex justify-between w-full">
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" asChild>
                <Link href={`/empreendimentos/${empreendimentoId}/parametros/${parametro.id}/impacto`}>
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Impacto
                </Link>
              </Button>
              <ClonarParametroDialog parametroId={parametro.id} parametroNome={parametro.nome} />
            </div>
            <div className="flex justify-between w-full">
              {!parametro.ativo ? (
                <Button
                  className="bg-aya-green hover:bg-opacity-90"
                  onClick={() => handleAtivarParametro(parametro.id)}
                  disabled={isActivating === parametro.id}
                >
                  {isActivating === parametro.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ativando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Ativar e Recalcular
                    </>
                  )}
                </Button>
              ) : (
                <Button variant="outline" className="border-gray-700 text-aya-green hover:bg-gray-800" disabled>
                  <Check className="mr-2 h-4 w-4" />
                  Ativo
                </Button>
              )}
              {!parametro.ativo && <ExcluirParametroDialog parametroId={parametro.id} parametroNome={parametro.nome} />}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
