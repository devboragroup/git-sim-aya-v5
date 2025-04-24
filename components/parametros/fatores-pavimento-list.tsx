"use client"

import { useState, useEffect } from "react"
import { createClientClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { atualizarFatorPavimento } from "@/actions/parametros"
import type { FatorPavimento } from "@/types/parametros"

interface FatoresPavimentoListProps {
  parametroId: string
}

export function FatoresPavimentoList({ parametroId }: FatoresPavimentoListProps) {
  const [fatores, setFatores] = useState<FatorPavimento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingFator, setEditingFator] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({})
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const supabase = createClientClient()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchFatores() {
      try {
        const { data, error } = await supabase
          .from("fatores_pavimento")
          .select("*")
          .eq("parametro_id", parametroId)
          .order("pavimento", { ascending: true })

        if (error) {
          throw error
        }

        setFatores(data || [])
      } catch (error) {
        console.error("Erro ao buscar fatores de pavimento:", error)
        toast({
          title: "Erro ao carregar fatores",
          description: "Não foi possível carregar os fatores de pavimento.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchFatores()

    // Configurar subscription para atualizações em tempo real
    const channel = supabase
      .channel("fatores-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fatores_pavimento",
          filter: `parametro_id=eq.${parametroId}`,
        },
        () => {
          fetchFatores()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [parametroId, supabase, toast])

  function handleEdit(fator: FatorPavimento) {
    setEditingFator(fator.id)
    setEditValues({
      ...editValues,
      [fator.id]: fator.fator.toString(),
    })
  }

  function handleCancelEdit() {
    setEditingFator(null)
    setEditValues({})
  }

  async function handleSave(fator: FatorPavimento) {
    setIsSaving(fator.id)

    try {
      const novoFator = editValues[fator.id]

      if (!novoFator || isNaN(Number.parseFloat(novoFator)) || Number.parseFloat(novoFator) <= 0) {
        throw new Error("O fator deve ser um número positivo")
      }

      const result = await atualizarFatorPavimento(fator.id, {
        pavimento: fator.pavimento,
        descricao: fator.descricao || undefined,
        fator: novoFator,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Fator atualizado",
        description: `O fator para o pavimento ${fator.pavimento} foi atualizado com sucesso.`,
      })

      setEditingFator(null)
      setEditValues({})
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar fator",
        description: error.message || "Ocorreu um erro ao atualizar o fator de pavimento.",
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

  if (fatores.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Fatores de Pavimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-gray-400">
              Nenhum fator de pavimento configurado. Clique em "Configurar Fatores" para gerar automaticamente os
              fatores com base nos pavimentos existentes.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Fatores de Pavimento</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-400">Pavimento</TableHead>
              <TableHead className="text-gray-400">Descrição</TableHead>
              <TableHead className="text-gray-400">Fator</TableHead>
              <TableHead className="text-gray-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fatores.map((fator) => (
              <TableRow key={fator.id}>
                <TableCell className="text-white">{fator.pavimento}</TableCell>
                <TableCell className="text-white">{fator.descricao || "-"}</TableCell>
                <TableCell className="text-white">
                  {editingFator === fator.id ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={editValues[fator.id] || fator.fator}
                      onChange={(e) => setEditValues({ ...editValues, [fator.id]: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white w-24"
                    />
                  ) : (
                    `${fator.fator.toFixed(2)}x`
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingFator === fator.id ? (
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
                        onClick={() => handleSave(fator)}
                        disabled={isSaving === fator.id}
                      >
                        {isSaving === fator.id ? (
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
                      onClick={() => handleEdit(fator)}
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
