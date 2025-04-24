"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Loader2 } from "lucide-react"

interface Empreendimento {
  id: string
  nome: string
  tipo: string
  endereco: string
}

export function EmpreendimentosList() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientClient()

  useEffect(() => {
    async function fetchEmpreendimentos() {
      try {
        const { data, error } = await supabase.from("empreendimentos").select("id, nome, tipo, endereco").order("nome")

        if (error) {
          throw error
        }

        setEmpreendimentos(data || [])
      } catch (error) {
        console.error("Erro ao buscar empreendimentos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmpreendimentos()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-aya-green" />
      </div>
    )
  }

  if (empreendimentos.length === 0) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center">
        <Building2 className="h-12 w-12 text-gray-500" />
        <h3 className="mt-4 text-lg font-medium text-white">Nenhum empreendimento encontrado</h3>
        <p className="text-sm text-gray-400">Comece criando seu primeiro empreendimento.</p>
        <Button className="mt-4 bg-aya-green hover:bg-opacity-90" asChild>
          <Link href="/empreendimentos/novo">Criar Empreendimento</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {empreendimentos.map((empreendimento) => (
        <Card key={empreendimento.id} className="overflow-hidden bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">{empreendimento.nome}</CardTitle>
            <CardDescription className="text-gray-400">{empreendimento.tipo}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">{empreendimento.endereco}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" asChild>
              <Link href={`/empreendimentos/${empreendimento.id}`}>Detalhes</Link>
            </Button>
            <Button className="bg-aya-green hover:bg-opacity-90" asChild>
              <Link href={`/empreendimentos/${empreendimento.id}/unidades`}>Unidades</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
