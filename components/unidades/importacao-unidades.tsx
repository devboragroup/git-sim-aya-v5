"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"
import { importarUnidades } from "@/actions/unidades"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"

interface ImportacaoUnidadesProps {
  empreendimentoId: string
}

interface UnidadeImportacao {
  identificador: string
  tipo: string
  area_privativa: number
  area_total?: number
  pavimento?: number
  dormitorios?: number
  suites?: number
  vagas?: number
  orientacao_solar?: string
  status?: string
  [key: string]: any
}

export function ImportacaoUnidades({ empreendimentoId }: ImportacaoUnidadesProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [unidades, setUnidades] = useState<UnidadeImportacao[]>([])
  const [erros, setErros] = useState<string[]>([])
  const [progresso, setProgresso] = useState(0)
  const [resultado, setResultado] = useState<{ sucesso: number; falhas: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivo(file)
    setIsLoading(true)
    setUnidades([])
    setErros([])
    setResultado(null)

    try {
      const data = await readFile(file)
      const { unidades, erros } = validarDados(data)
      setUnidades(unidades)
      setErros(erros)
    } catch (error: any) {
      toast({
        title: "Erro ao processar arquivo",
        description: error.message || "Ocorreu um erro ao processar o arquivo.",
        variant: "destructive",
      })
      setErros([error.message || "Erro desconhecido ao processar o arquivo."])
    } finally {
      setIsLoading(false)
    }
  }

  const readFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          if (!data) {
            reject(new Error("Não foi possível ler o arquivo."))
            return
          }

          const workbook = XLSX.read(data, { type: "binary" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(worksheet)

          resolve(json)
        } catch (error) {
          reject(new Error("Formato de arquivo inválido. Use CSV ou Excel (.xlsx)."))
        }
      }

      reader.onerror = () => {
        reject(new Error("Erro ao ler o arquivo."))
      }

      reader.readAsBinaryString(file)
    })
  }

  const validarDados = (data: any[]): { unidades: UnidadeImportacao[]; erros: string[] } => {
    const unidades: UnidadeImportacao[] = []
    const erros: string[] = []

    if (data.length === 0) {
      erros.push("O arquivo não contém dados.")
      return { unidades, erros }
    }

    // Verificar colunas obrigatórias
    const primeiraLinha = data[0]
    const colunas = Object.keys(primeiraLinha)

    if (!colunas.some((col) => col.toLowerCase().includes("identificador"))) {
      erros.push("Coluna 'identificador' não encontrada.")
    }

    if (!colunas.some((col) => col.toLowerCase().includes("tipo"))) {
      erros.push("Coluna 'tipo' não encontrada.")
    }

    if (!colunas.some((col) => col.toLowerCase().includes("area") && col.toLowerCase().includes("privativa"))) {
      erros.push("Coluna 'area_privativa' não encontrada.")
    }

    if (erros.length > 0) {
      return { unidades, erros }
    }

    // Mapear e validar cada linha
    data.forEach((row, index) => {
      try {
        const unidade: UnidadeImportacao = {
          identificador: "",
          tipo: "",
          area_privativa: 0,
        }

        // Mapear colunas (considerando variações nos nomes)
        for (const coluna of colunas) {
          const colunaLower = coluna.toLowerCase()
          const valor = row[coluna]

          if (colunaLower.includes("identificador")) {
            unidade.identificador = String(valor)
          } else if (colunaLower.includes("tipo")) {
            unidade.tipo = String(valor)
          } else if (colunaLower.includes("area") && colunaLower.includes("privativa")) {
            unidade.area_privativa = Number(valor)
          } else if (colunaLower.includes("area") && colunaLower.includes("total")) {
            unidade.area_total = Number(valor)
          } else if (colunaLower.includes("pavimento") || colunaLower.includes("andar")) {
            unidade.pavimento = Number(valor)
          } else if (colunaLower.includes("dormitorio") || colunaLower.includes("quarto")) {
            unidade.dormitorios = Number(valor)
          } else if (colunaLower.includes("suite")) {
            unidade.suites = Number(valor)
          } else if (colunaLower.includes("vaga")) {
            unidade.vagas = Number(valor)
          } else if (colunaLower.includes("orientacao") || colunaLower.includes("solar")) {
            unidade.orientacao_solar = String(valor).toLowerCase()
          } else if (colunaLower.includes("status")) {
            unidade.status = String(valor).toLowerCase()
          }
        }

        // Validar campos obrigatórios
        if (!unidade.identificador) {
          throw new Error(`Linha ${index + 2}: Identificador não informado.`)
        }

        if (!unidade.tipo) {
          throw new Error(`Linha ${index + 2}: Tipo não informado.`)
        }

        if (isNaN(unidade.area_privativa) || unidade.area_privativa <= 0) {
          throw new Error(`Linha ${index + 2}: Área privativa inválida.`)
        }

        unidades.push(unidade)
      } catch (error: any) {
        erros.push(error.message)
      }
    })

    return { unidades, erros }
  }

  const handleImportar = async () => {
    if (unidades.length === 0) {
      toast({
        title: "Nenhuma unidade para importar",
        description: "Selecione um arquivo com dados de unidades.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgresso(0)
    setResultado(null)

    try {
      let sucessos = 0
      let falhas = 0

      // Processar em lotes para evitar sobrecarga
      const loteSize = 10
      const totalLotes = Math.ceil(unidades.length / loteSize)

      for (let i = 0; i < unidades.length; i += loteSize) {
        const lote = unidades.slice(i, i + loteSize)
        const result = await importarUnidades(empreendimentoId, lote)

        if (result.sucesso) {
          sucessos += result.sucesso
        }

        if (result.falhas) {
          falhas += result.falhas
        }

        // Atualizar progresso
        const progressoAtual = Math.round(((i + lote.length) / unidades.length) * 100)
        setProgresso(progressoAtual)
      }

      setResultado({ sucesso: sucessos, falhas })

      if (falhas === 0) {
        toast({
          title: "Importação concluída",
          description: `${sucessos} unidades importadas com sucesso.`,
        })
      } else {
        toast({
          title: "Importação concluída com avisos",
          description: `${sucessos} unidades importadas com sucesso. ${falhas} unidades não puderam ser importadas.`,
          variant: "destructive",
        })
      }

      // Recarregar a página após 3 segundos
      setTimeout(() => {
        router.refresh()
      }, 3000)
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro durante a importação das unidades.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setProgresso(100)
    }
  }

  const handleDownloadModelo = () => {
    // Criar um modelo de planilha
    const modelo = [
      {
        identificador: "AP101",
        tipo: "Apartamento",
        area_privativa: 75.5,
        area_total: 90.0,
        pavimento: 1,
        dormitorios: 2,
        suites: 1,
        vagas: 1,
        orientacao_solar: "leste",
        status: "disponivel",
      },
      {
        identificador: "AP102",
        tipo: "Apartamento",
        area_privativa: 65.0,
        area_total: 80.0,
        pavimento: 1,
        dormitorios: 2,
        suites: 1,
        vagas: 1,
        orientacao_solar: "oeste",
        status: "disponivel",
      },
    ]

    // Criar planilha
    const ws = XLSX.utils.json_to_sheet(modelo)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Unidades")

    // Gerar arquivo e fazer download
    XLSX.writeFile(wb, "modelo_importacao_unidades.xlsx")
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Instruções para Importação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-300">
          <p>Para importar unidades, prepare um arquivo CSV ou Excel (.xlsx) com as seguintes colunas:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>identificador</strong> (obrigatório): Código ou nome da unidade
            </li>
            <li>
              <strong>tipo</strong> (obrigatório): Tipo da unidade (ex: Apartamento, Casa, Sala)
            </li>
            <li>
              <strong>area_privativa</strong> (obrigatório): Área privativa em m²
            </li>
            <li>
              <strong>area_total</strong> (opcional): Área total em m²
            </li>
            <li>
              <strong>pavimento</strong> (opcional): Número do pavimento/andar
            </li>
            <li>
              <strong>dormitorios</strong> (opcional): Quantidade de dormitórios
            </li>
            <li>
              <strong>suites</strong> (opcional): Quantidade de suítes
            </li>
            <li>
              <strong>vagas</strong> (opcional): Quantidade de vagas de garagem
            </li>
            <li>
              <strong>orientacao_solar</strong> (opcional): Orientação solar (norte, sul, leste, oeste)
            </li>
            <li>
              <strong>status</strong> (opcional): Status da unidade (disponivel, reservado, vendido)
            </li>
          </ul>
          <Button
            variant="outline"
            className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={handleDownloadModelo}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Modelo de Planilha
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Selecionar Arquivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="arquivo" className="text-white">
                Arquivo CSV ou Excel (.xlsx)
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="arquivo"
                  type="file"
                  accept=".csv,.xlsx"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={isLoading || isProcessing}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isProcessing}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar
                </Button>
              </div>
              {arquivo && (
                <p className="text-sm text-gray-400 flex items-center">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {arquivo.name} ({(arquivo.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <Icons.spinner className="h-8 w-8 animate-spin text-aya-green" />
          <span className="ml-2 text-white">Processando arquivo...</span>
        </div>
      )}

      {erros.length > 0 && (
        <Alert variant="destructive" className="bg-red-900 border-red-800 text-white">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erros encontrados</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              {erros.map((erro, index) => (
                <li key={index}>{erro}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {unidades.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Prévia da Importação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-gray-800">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800 hover:bg-gray-800">
                    <TableHead className="text-gray-300">Identificador</TableHead>
                    <TableHead className="text-gray-300">Tipo</TableHead>
                    <TableHead className="text-gray-300">Área Privativa</TableHead>
                    <TableHead className="text-gray-300">Pavimento</TableHead>
                    <TableHead className="text-gray-300">Dormitórios</TableHead>
                    <TableHead className="text-gray-300">Suítes</TableHead>
                    <TableHead className="text-gray-300">Vagas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unidades.slice(0, 5).map((unidade, index) => (
                    <TableRow key={index} className="border-gray-800 hover:bg-gray-800">
                      <TableCell className="text-white">{unidade.identificador}</TableCell>
                      <TableCell className="text-white">{unidade.tipo}</TableCell>
                      <TableCell className="text-white">{unidade.area_privativa}</TableCell>
                      <TableCell className="text-white">{unidade.pavimento || "-"}</TableCell>
                      <TableCell className="text-white">{unidade.dormitorios || "-"}</TableCell>
                      <TableCell className="text-white">{unidade.suites || "-"}</TableCell>
                      <TableCell className="text-white">{unidade.vagas || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {unidades.length > 5 && (
              <p className="text-sm text-gray-400 mt-2">Exibindo 5 de {unidades.length} unidades.</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t border-gray-800 bg-gray-900 px-6 py-4">
            <div className="text-white">
              Total de unidades: <span className="font-bold">{unidades.length}</span>
            </div>
            <Button
              onClick={handleImportar}
              className="bg-aya-green hover:bg-opacity-90"
              disabled={isProcessing || erros.length > 0}
            >
              {isProcessing ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Unidades
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {isProcessing && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Progresso da Importação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={progresso} className="h-2 bg-gray-800" />
              <div className="flex justify-between text-sm text-gray-400">
                <span>{progresso}% concluído</span>
                <span>
                  {Math.round((progresso / 100) * unidades.length)} de {unidades.length} unidades
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {resultado && (
        <Alert
          className={
            resultado.falhas === 0
              ? "bg-green-900 border-green-800 text-white"
              : "bg-amber-900 border-amber-800 text-white"
          }
        >
          {resultado.falhas === 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>Importação concluída</AlertTitle>
          <AlertDescription>
            <p className="mt-2">
              {resultado.sucesso} unidades importadas com sucesso.
              {resultado.falhas > 0 && ` ${resultado.falhas} unidades não puderam ser importadas.`}
            </p>
            <Button
              className="mt-4 bg-aya-green hover:bg-opacity-90"
              onClick={() => router.push(`/empreendimentos/${empreendimentoId}`)}
            >
              Voltar para o Empreendimento
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
