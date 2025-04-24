"use client"

import { useState, useEffect } from "react"
import { createClientClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { ValorizacaoPavimento } from "@/types/parametros"

interface ValorizacaoPavimentoListProps {
  parametroId: string
}

export function ValorizacaoPavimentoList({ parametroId }: ValorizacaoPavimentoListProps) {
  const [valorizacoes, setValorizacoes] = useState<ValorizacaoPavimento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingValorizacao, setEditingValorizacao] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({})
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const supabase = createClientClient()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchValorizacoes() {
      try {
        const { data, error } = await supabase
          .from("valorizacao_pavimentos")
          .select("*")
          .eq("parametro_id", parametroId)
          .order("pavimento", { ascending: true })

        if (error) {
          throw error
        }

        setValorizacoes(data || [])
      } catch (error) {
        console.error("Erro ao buscar valorizações de pavimento:", error)
        toast({
          title: "Erro ao carregar valorizações",
          description: "Não foi possível carregar as valorizações de pavimento.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchValorizacoes()

    // Configurar subscription para atualizações em tempo real
    const channel = supabase
      .channel("valorizacoes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "valorizacao_pavimentos",
          filter: `parametro_id=eq.${parametroId}`,
        },
        () => {
          fetchValorizacoes()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [parametroId, supabase, toast])

  function handleEdit(valorizacao: ValorizacaoPavimento) {
    setEditingValorizacao(valorizacao.id!)
    setEditValues({
      ...editValues,
      [valorizacao.id!]: valorizacao.percentual.toString(),
    })
  }

  function handleCancelEdit() {
    setEditingValorizacao(null)
    setEditValues({})
  }

  async function handleSave(valorizacao: ValorizacaoPavimento) {
    setIsSaving(valorizacao.id!)

    try {
      const novoPercentual = editValues[valorizacao.id!]

      if (novoPercentual === undefined || isNaN(Number.parseFloat(novoPercentual))) {
        throw new Error("O percentual deve ser um número válido")
      }

      const { error } = await supabase
        .from("valorizacao_pavimentos")
        .update({ percentual: Number.parseFloat(novoPercentual) })
        .eq("id", valorizacao.id)

      if (error) {
        throw new Error(error.message)
      }

      toast({
        title: "Valorização atualizada",
        description: `A valorização para o pavimento ${valorizacao.pavimento} foi atualizada com sucesso.`,
      })

      setEditingValorizacao(null)
      setEditValues({})
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar valorização",
        description: error.message || "Ocorreu um erro ao atualizar a valorização de pavimento.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-aya-green" />
      </div>
    )
  }

  if (valorizacoes.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Valorizações por Pavimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-gray-400">
              Nenhuma valorização por pavimento configurada. Edite o parâmetro de precificação para configurar as
              valorizações.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Valorizações por Pavimento</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-400">Pavimento</TableHead>
              <TableHead className="text-gray-400">Percentual (%)</TableHead>
              <TableHead className="text-gray-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {valorizacoes.map((valorizacao) => (
              <TableRow key={valorizacao.id}>
                <TableCell className="text-white">{valorizacao.pavimento}</TableCell>
                <TableCell className="text-white">
                  {editingValorizacao === valorizacao.id ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues[valorizacao.id!] || valorizacao.percentual}
                      onChange={(e) => setEditValues({ ...editValues, [valorizacao.id!]: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white w-24"
                    />
                  ) : (
                    <span
                      className={
                        valorizacao.percentual > 0
                          ? "text-green-500"
                          : valorizacao.percentual < 0
                            ? "text-red-500"
                            : "text-white"
                      }
                    >
                      {valorizacao.percentual > 0 ? "+" : ""}
                      {valorizacao.percentual.toFixed(2)}%
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingValorizacao === valorizacao.id ? (
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
                        onClick={() => handleSave(valorizacao)}
                        disabled={isSaving === valorizacao.id}
                      >
                        {isSaving === valorizacao.id ? (
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
                      onClick={() => handleEdit(valorizacao)}
                    >
                      Editar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
