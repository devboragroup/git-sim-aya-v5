"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExcluirUnidadeDialog } from "@/components/unidades/excluir-unidade-dialog"

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
  status: string | null
}

interface UnidadesListProps {
  empreendimentoId: string
}

export default function UnidadesList({ empreendimentoId }: UnidadesListProps) {
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const supabase = createClientClient()

  useEffect(() => {
    async function fetchUnidades() {
      try {
        const { data, error } = await supabase
          .from("unidades")
          .select("*")
          .eq("empreendimento_id", empreendimentoId)
          .ilike("identificador", `%${searchTerm}%`)
          .eq(filterStatus ? "status" : "empreendimento_id", filterStatus ? filterStatus : empreendimentoId)
          .order("identificador")

        if (error) {
          throw error
        }

        setUnidades(data || [])
      } catch (error) {
        console.error("Erro ao buscar unidades:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUnidades()
  }, [empreendimentoId, searchTerm, filterStatus, supabase])

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
        <Building2 className="h-12 w-12 text-gray-500" />
        <h3 className="mt-4 text-lg font-medium text-white">Nenhuma unidade encontrada</h3>
        <p className="text-sm text-gray-400">Comece criando sua primeira unidade.</p>
        <Button className="mt-4 bg-aya-green hover:bg-opacity-90" asChild>
          <Link href={`/empreendimentos/${empreendimentoId}/unidades/nova`}>Criar Unidade</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          type="text"
          placeholder="Buscar por identificador..."
          className="bg-gray-800 border-gray-700 text-white w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex items-center space-x-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="reservado">Reservado</SelectItem>
              <SelectItem value="vendido">Vendido</SelectItem>
              <SelectItem value="indisponivel">Indisponível</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {unidades.map((unidade) => (
          <Card key={unidade.id} className="overflow-hidden bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">{unidade.identificador}</CardTitle>
                <ExcluirUnidadeDialog
                  unidadeId={unidade.id}
                  unidadeIdentificador={unidade.identificador}
                  empreendimentoId={empreendimentoId}
                />
              </div>
              <CardDescription className="text-gray-400">{unidade.tipo}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">Área: {unidade.area_privativa} m²</p>
              <p className="text-sm text-gray-400">Pavimento: {unidade.pavimento || "N/A"}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" asChild>
                <Link href={`/empreendimentos/${empreendimentoId}/unidades/${unidade.id}`}>Detalhes</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
