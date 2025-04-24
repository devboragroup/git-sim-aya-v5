"use client"

import { useState, useEffect } from "react"
import { createClientClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, Search, Filter } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { aplicarAjusteFino } from "@/actions/unidades"

interface Unidade {
  id: string
  identificador: string
  tipo: string
  area_privativa: number
  pavimento: number | null
  dormitorios: number | null
  suites: number | null
  vagas: number | null
  orientacao_solar: string | null
  ajuste_fino_percentual: number | null
  ajuste_fino_motivo: string | null
  valor_calculado: number | null
}

interface AjustesFinosListProps {
  empreendimentoId: string
}

export function AjustesFinosList({ empreendimentoId }: AjustesFinosListProps) {
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [filteredUnidades, setFilteredUnidades] = useState<Unidade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUnidade, setEditingUnidade] = useState<string | null>(null)
  const [ajustePercentual, setAjustePercentual] = useState<string>("")
  const [ajusteMotivo, setAjusteMotivo] = useState<string>("")
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const supabase = createClientClient()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchUnidades() {
      try {
        const { data, error } = await supabase
          .from("unidades")
          .select(
            "id, identificador, tipo, area_privativa, pavimento, dormitorios, suites, vagas, orientacao_solar, ajuste_fino_percentual, ajuste_fino_motivo, valor_calculado",
          )
          .eq("empreendimento_id", empreendimentoId)
          .order("identificador", { ascending: true })

        if (error) {
          throw error
        }

        setUnidades(data || [])
        setFilteredUnidades(data || [])
      } catch (error) {
        console.error("Erro ao buscar unidades:", error)
        toast({
          title: "Erro ao carregar unidades",
          description: "Não foi possível carregar as unidades do empreendimento.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUnidades()

    // Configurar subscription para atualizações em tempo real
    const channel = supabase
      .channel("unidades-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "unidades",
          filter: `empreendimento_id=eq.${empreendimentoId}`,
        },
        () => {
          fetchUnidades()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [empreendimentoId, supabase, toast])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUnidades(unidades)
    } else {
      const filtered = unidades.filter(
        (unidade) =>
          unidade.identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
          unidade.tipo.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredUnidades(filtered)
    }
  }, [searchTerm, unidades])

  function handleEdit(unidade: Unidade) {
    setEditingUnidade(unidade.id)
    setAjustePercentual(unidade.ajuste_fino_percentual?.toString() || "0")
    setAjusteMotivo(unidade.ajuste_fino_motivo || "")
  }

  function handleCancelEdit() {
    setEditingUnidade(null)
    setAjustePercentual("")
    setAjusteMotivo("")
  }

  async function handleSave(unidade: Unidade) {
    setIsSaving(unidade.id)

    try {
      const percentual = Number.parseFloat(ajustePercentual)

      if (isNaN(percentual)) {
        throw new Error("O percentual deve ser um número válido")
      }

      const result = await aplicarAjusteFino({
        unidadeId: unidade.id,
        percentual,
        motivo: ajusteMotivo || null,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Ajuste aplicado",
        description: `O ajuste fino para a unidade ${unidade.identificador} foi aplicado com sucesso.`,
      })

      setEditingUnidade(null)
      setAjustePercentual("")
      setAjusteMotivo("")
    } catch (error: any) {
      toast({
        title: "Erro ao aplicar ajuste",
        description: error.message || "Ocorreu um erro ao aplicar o ajuste fino.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(null)
    }
  }

  // Formatar valores monetários
  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A"
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

  if (unidades.length === 0) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center">
        <Filter className="h-12 w-12 text-gray-500" />
        <h3 className="mt-4 text-lg font-medium text-white">Nenhuma unidade encontrada</h3>
        <p className="text-sm text-gray-400">Cadastre unidades para realizar ajustes finos.</p>
      </div>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Ajustes Finos por Unidade</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar unidade..."
            className="pl-8 bg-gray-800 border-gray-700 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-gray-800/50">
                <TableHead className="text-gray-400">Identificador</TableHead>
                <TableHead className="text-gray-400">Tipo</TableHead>
                <TableHead className="text-gray-400">Área</TableHead>
                <TableHead className="text-gray-400">Pavimento</TableHead>
                <TableHead className="text-gray-400">Ajuste (%)</TableHead>
                <TableHead className="text-gray-400">Valor</TableHead>
                <TableHead className="text-gray-400 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnidades.map((unidade) => (
                <TableRow key={unidade.id} className="hover:bg-gray-800/50">
                  <TableCell className="font-medium text-white">{unidade.identificador}</TableCell>
                  <TableCell className="text-white">{unidade.tipo}</TableCell>
                  <TableCell className="text-white">{unidade.area_privativa} m²</TableCell>
                  <TableCell className="text-white">{unidade.pavimento || "N/A"}</TableCell>
                  <TableCell className="text-white">
                    {editingUnidade === unidade.id ? (
                      <div className="flex flex-col space-y-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={ajustePercentual}
                          onChange={(e) => setAjustePercentual(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white w-24"
                        />
                        <Textarea
                          placeholder="Motivo do ajuste..."
                          value={ajusteMotivo}
                          onChange={(e) => setAjusteMotivo(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white h-20"
                        />
                      </div>
                    ) : (
                      <>
                        {unidade.ajuste_fino_percentual !== null ? (
                          <div>
                            <span
                              className={
                                unidade.ajuste_fino_percentual > 0
                                  ? "text-green-500"
                                  : unidade.ajuste_fino_percentual < 0
                                    ? "text-red-500"
                                    : "text-white"
                              }
                            >
                              {unidade.ajuste_fino_percentual > 0 ? "+" : ""}
                              {unidade.ajuste_fino_percentual}%
                            </span>
                            {unidade.ajuste_fino_motivo && (
                              <p className="text-xs text-gray-400 mt-1">{unidade.ajuste_fino_motivo}</p>
                            )}
                          </div>
                        ) : (
                          "0%"
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-white">{formatCurrency(unidade.valor_calculado)}</TableCell>
                  <TableCell className="text-right">
                    {editingUnidade === unidade.id ? (
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                          onClick={handleCancelEdit}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-aya-green hover:bg-opacity-90"
                          onClick={() => handleSave(unidade)}
                          disabled={isSaving === unidade.id}
                        >
                          {isSaving === unidade.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        onClick={() => handleEdit(unidade)}
                      >
                        Ajustar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
