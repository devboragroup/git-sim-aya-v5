"use client"

import { useState, useEffect } from "react"
import { createClientClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface HistoricoAjustesProps {
  unidadeId: string
}

interface AjusteFino {
  id: string
  unidade_id: string
  usuario_id: string
  percentual_anterior: number | null
  percentual_novo: number
  motivo: string | null
  valor_antes: number | null
  valor_depois: number | null
  created_at: string
  usuario_email?: string
}

export function HistoricoAjustes({ unidadeId }: HistoricoAjustesProps) {
  const [ajustes, setAjustes] = useState<AjusteFino[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientClient()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchHistoricoAjustes() {
      try {
        // Buscar histórico de ajustes
        const { data, error } = await supabase
          .from("historico_ajustes_unidade")
          .select("*")
          .eq("unidade_id", unidadeId)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        // Buscar informações dos usuários para cada ajuste
        const ajustesComUsuarios = await Promise.all(
          (data || []).map(async (ajuste) => {
            try {
              const { data: userData } = await supabase
                .from("auth.users")
                .select("email")
                .eq("id", ajuste.usuario_id)
                .single()

              return {
                ...ajuste,
                usuario_email: userData?.email || "Usuário desconhecido",
              }
            } catch (e) {
              return {
                ...ajuste,
                usuario_email: "Usuário desconhecido",
              }
            }
          }),
        )

        setAjustes(ajustesComUsuarios)
      } catch (error) {
        console.error("Erro ao buscar histórico de ajustes:", error)
        setError("Não foi possível carregar o histórico de ajustes.")
        toast({
          title: "Erro ao carregar histórico",
          description: "Não foi possível carregar o histórico de ajustes.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistoricoAjustes()
  }, [unidadeId, supabase, toast])

  // Formatar valores monetários
  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Histórico de Ajustes</CardTitle>
          <CardDescription className="text-gray-400">Carregando histórico...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-aya-green" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Histórico de Ajustes</CardTitle>
          <CardDescription className="text-gray-400">Erro ao carregar histórico</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (ajustes.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Histórico de Ajustes</CardTitle>
          <CardDescription className="text-gray-400">Registro de alterações nos ajustes finos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-8">Nenhum ajuste fino foi aplicado a esta unidade.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Histórico de Ajustes</CardTitle>
        <CardDescription className="text-gray-400">Registro de alterações nos ajustes finos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {ajustes.map((ajuste) => (
            <div key={ajuste.id} className="border-b border-gray-800 pb-4 last:border-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm text-gray-400">
                    {formatDate(ajuste.created_at)} por {ajuste.usuario_email}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">
                    {ajuste.percentual_anterior !== null ? `${ajuste.percentual_anterior}%` : "0%"}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span
                    className={`font-medium ${
                      ajuste.percentual_novo > 0
                        ? "text-green-500"
                        : ajuste.percentual_novo < 0
                          ? "text-red-500"
                          : "text-white"
                    }`}
                  >
                    {ajuste.percentual_novo > 0 ? "+" : ""}
                    {ajuste.percentual_novo}%
                  </span>
                </div>
              </div>

              {ajuste.motivo && (
                <p className="text-sm text-gray-300 mb-2">
                  <span className="font-medium">Motivo:</span> {ajuste.motivo}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-xs text-gray-400">Valor Anterior</p>
                  <p className="text-white">{formatCurrency(ajuste.valor_antes)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Valor Atual</p>
                  <p
                    className={`font-medium ${
                      ajuste.valor_depois && ajuste.valor_antes
                        ? ajuste.valor_depois > ajuste.valor_antes
                          ? "text-green-500"
                          : ajuste.valor_depois < ajuste.valor_antes
                            ? "text-red-500"
                            : "text-white"
                        : "text-white"
                    }`}
                  >
                    {formatCurrency(ajuste.valor_depois)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
