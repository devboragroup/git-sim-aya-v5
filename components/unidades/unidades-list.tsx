"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Filter, Edit, Eye, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ExcluirUnidadeDialog } from "@/components/unidades/excluir-unidade-dialog"

interface UnidadesListProps {
  empreendimentoId: string
}

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
  valor_calculado: number | null
  status: string | null
}

export function UnidadesList({ empreendimentoId }: UnidadesListProps) {
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [filteredUnidades, setFilteredUnidades] = useState<Unidade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [tipoFilter, setTipoFilter] = useState<string>("todos")
  const [pavimentoFilter, setPavimentoFilter] = useState<string>("todos")
  const [totalUnidades, setTotalUnidades] = useState(0)
  const [totalValor, setTotalValor] = useState(0)

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const supabase = createClientClient()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchUnidades() {
      try {
        const { data, error } = await supabase
          .from("unidades")
          .select("*")
          .eq("empreendimento_id", empreendimentoId)
          .order("identificador", { ascending: true })

        if (error) {
          throw error
        }

        setUnidades(data || [])
        setFilteredUnidades(data || [])
        setTotalUnidades(data?.length || 0)
        setTotalValor(data?.reduce((sum, unidade) => sum + (unidade.valor_calculado || 0), 0) || 0)
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

  // Aplicar filtros quando os valores mudarem
  useEffect(() => {
    setIsFiltering(true)
    setCurrentPage(1) // Resetar para a primeira página ao filtrar

    let filtered = [...unidades]

    // Aplicar filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (unidade) =>
          unidade.identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
          unidade.tipo.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Aplicar filtro de status
    if (statusFilter !== "todos") {
      filtered = filtered.filter((unidade) => unidade.status === statusFilter)
    }

    // Aplicar filtro de tipo
    if (tipoFilter !== "todos") {
      filtered = filtered.filter((unidade) => unidade.tipo === tipoFilter)
    }

    // Aplicar filtro de pavimento
    if (pavimentoFilter !== "todos") {
      if (pavimentoFilter === "sem-pavimento") {
        filtered = filtered.filter((unidade) => unidade.pavimento === null)
      } else {
        filtered = filtered.filter((unidade) => unidade.pavimento === Number(pavimentoFilter))
      }
    }

    setFilteredUnidades(filtered)
    setIsFiltering(false)
  }, [searchTerm, statusFilter, tipoFilter, pavimentoFilter, unidades])

  // Obter lista de tipos únicos para o filtro
  const tiposUnicos = Array.from(new Set(unidades.map((unidade) => unidade.tipo)))

  // Obter lista de pavimentos únicos para o filtro
  const pavimentosUnicos = Array.from(new Set(unidades.map((unidade) => unidade.pavimento)))
    .filter((pavimento) => pavimento !== null)
    .sort((a, b) => (a || 0) - (b || 0))

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

  // Lógica de paginação
  const totalPages = Math.ceil(filteredUnidades.length / itemsPerPage)
  const paginatedUnidades = filteredUnidades.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Função para gerar números de página para navegação
  const getPageNumbers = () => {
    const maxPagesToShow = 5
    const pages = []

    if (totalPages <= maxPagesToShow) {
      // Se houver poucas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Sempre mostrar a primeira página
      pages.push(1)

      // Calcular páginas do meio
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Ajustar se estiver próximo do início ou fim
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4)
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3)
      }

      // Adicionar elipses se necessário
      if (startPage > 2) {
        pages.push("...")
      }

      // Adicionar páginas do meio
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Adicionar elipses se necessário
      if (endPage < totalPages - 1) {
        pages.push("...")
      }

      // Sempre mostrar a última página
      pages.push(totalPages)
    }

    return pages
  }

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("todos")
    setTipoFilter("todos")
    setPavimentoFilter("todos")
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
        <p className="text-sm text-gray-400">Comece cadastrando sua primeira unidade.</p>
        <Button className="mt-4 bg-aya-green hover:bg-opacity-90" asChild>
          <Link href={`/empreendimentos/${empreendimentoId}/unidades/nova`}>Cadastrar Unidade</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total de Unidades</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{totalUnidades}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalValor)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Valor Médio por Unidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(totalUnidades > 0 ? totalValor / totalUnidades : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar unidade..."
            className="pl-8 bg-gray-800 border-gray-700 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="reservado">Reservado</SelectItem>
              <SelectItem value="vendido">Vendido</SelectItem>
              <SelectItem value="indisponivel">Indisponível</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {tiposUnicos.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={pavimentoFilter} onValueChange={setPavimentoFilter}>
            <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Pavimento" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="todos">Todos os pavimentos</SelectItem>
              <SelectItem value="sem-pavimento">Sem pavimento</SelectItem>
              {pavimentosUnicos.map((pavimento) => (
                <SelectItem key={`pavimento-${pavimento}`} value={String(pavimento)}>
                  Pavimento {pavimento}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border border-gray-800 relative">
        {isFiltering && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10 rounded-md">
            <Loader2 className="h-8 w-8 animate-spin text-aya-green" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-800/50">
              <TableHead className="text-gray-400">Identificador</TableHead>
              <TableHead className="text-gray-400">Tipo</TableHead>
              <TableHead className="text-gray-400">Área</TableHead>
              <TableHead className="text-gray-400">Pavimento</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Valor</TableHead>
              <TableHead className="text-gray-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUnidades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-gray-400">Nenhuma unidade encontrada com os filtros aplicados</p>
                    <Button variant="link" className="text-aya-green mt-2" onClick={clearFilters}>
                      Limpar filtros
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUnidades.map((unidade) => (
                <TableRow key={unidade.id} className="hover:bg-gray-800/50">
                  <TableCell className="font-medium text-white">{unidade.identificador}</TableCell>
                  <TableCell className="text-white">{unidade.tipo}</TableCell>
                  <TableCell className="text-white">{unidade.area_privativa} m²</TableCell>
                  <TableCell className="text-white">{unidade.pavimento !== null ? unidade.pavimento : "N/A"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(unidade.status)}>{formatStatus(unidade.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-white">{formatCurrency(unidade.valor_calculado)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                      >
                        <Link href={`/empreendimentos/${empreendimentoId}/unidades/${unidade.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver</span>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                      >
                        <Link href={`/empreendimentos/${empreendimentoId}/unidades/${unidade.id}/editar`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Link>
                      </Button>
                      <ExcluirUnidadeDialog
                        unidadeId={unidade.id}
                        unidadeIdentificador={unidade.identificador}
                        empreendimentoId={empreendimentoId}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Controles de paginação */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Exibindo {paginatedUnidades.length} de {filteredUnidades.length} unidades
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Itens por página:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value))
                setCurrentPage(1) // Reset para primeira página ao mudar itens por página
              }}
            >
              <SelectTrigger className="w-[70px] h-8 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span key={`ellipsis-${index}`} className="text-gray-400">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              ) : (
                <Button
                  key={`page-${page}`}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className={`h-8 w-8 ${
                    currentPage === page
                      ? "bg-aya-green hover:bg-aya-green/90"
                      : "border-gray-700 text-gray-300 hover:bg-gray-800"
                  }`}
                  onClick={() => setCurrentPage(Number(page))}
                >
                  {page}
                </Button>
              ),
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
