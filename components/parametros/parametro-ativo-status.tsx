"use client"

import { useState, useEffect } from "react"
import { createClientClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Check, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import type { ParametroPrecificacao } from "@/types/parametros"

interface ParametroAtivoStatusProps {
  empreendimentoId: string
}

export function ParametroAtivoStatus({ empreendimentoId }: ParametroAtivoStatusProps) {
  const [parametroAtivo, setParametroAtivo] = useState<ParametroPrecificacao | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [vgvTotal, setVgvTotal] = useState<number | null>(null)
  const [unidadesTotal, setUnidadesTotal] = useState<number | null>(null)
  const supabase = createClientClient()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchParametroAtivo() {
      try {
        // Buscar parâmetro ativo
        const { data: parametro, error } = await supabase
          .from("parametros_precificacao")
          .select("*")
          .eq("empreendimento_id", empreendimentoId)
          .eq("ativo", true)
          .single()

        if (error) {
          if (error.code !== "PGRST116") {
            // Não é erro "no rows returned"
            console.error("Erro ao buscar parâmetro ativo:", error)
          }
          setParametroAtivo(null)
        } else {
          setParametroAtivo(parametro)
        }

        // Buscar VGV total e número de unidades
        const { data: vgvData } = await supabase
          .rpc("calcular_vgv_completo", { p_empreendimento_id: empreendimentoId })
          .single()

        if (vgvData) {
          setVgvTotal(vgvData.vgv_total || 0)
          setUnidadesTotal(vgvData.unidades_total || 0)
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchParametroAtivo()

    // Configurar subscription para atualizações em tempo real
    const channel = supabase
      .channel("parametro-ativo-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parametros_precificacao",
          filter: `empreendimento_id=eq.${empreendimentoId}`,
        },
        () => {
          fetchParametroAtivo()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [empreendimentoId, supabase, toast])

  // Formatar valores monetários
  const formatCurrency = (value: number | null) => {
    if (value === null) return "R$ 0,00"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Parâmetro de Precificação</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-aya-green" />
        </CardContent>
      </Card>
    )
  }

  if (!parametroAtivo) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
            Parâmetro de Precificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-400 mb-4">
              Nenhum parâmetro de precificação ativo. Ative um parâmetro para calcular os valores das unidades.
            </p>
            <Button className="bg-aya-green hover:bg-opacity-90" asChild>
              <Link href={`/empreendimentos/${empreendimentoId}/parametros`}>Gerenciar Parâmetros</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Check className="mr-2 h-5 w-5 text-aya-green" />
          Parâmetro de Precificação Ativo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-400">Nome do Parâmetro</p>
            <p className="text-xl font-medium text-white">{parametroAtivo.nome}</p>
          </div>
          <Button className="bg-aya-green hover:bg-opacity-90" asChild>
            <Link href={`/empreendimentos/${empreendimentoId}/parametros/${parametroAtivo.id}`}>Editar Parâmetro</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-800 p-4 rounded-md">
            <p className="text-sm font-medium text-gray-400">VGV Total Calculado</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(vgvTotal)}</p>
            <p className="text-xs text-gray-400 mt-1">
              Baseado em {unidadesTotal} unidade{unidadesTotal !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded-md">
            <p className="text-sm font-medium text-gray-400">Valores por m²</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-gray-400">Studio</p>
                <p className="text-sm text-white">{formatCurrency(parametroAtivo.valor_m2_studio)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Apartamento</p>
                <p className="text-sm text-white">{formatCurrency(parametroAtivo.valor_m2_apartamento)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" asChild>
            <Link href={`/empreendimentos/${empreendimentoId}/parametros`}>Ver Todos os Parâmetros</Link>
          </Button>
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" asChild>
            <Link href={`/empreendimentos/${empreendimentoId}/unidades`}>Ver Unidades</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
