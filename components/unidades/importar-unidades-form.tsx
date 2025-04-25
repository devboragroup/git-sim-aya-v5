"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, FileSpreadsheet, Upload } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { importarUnidades } from "@/actions/unidades"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface ImportarUnidadesFormProps {
  empreendimentoId: string
}

interface ImportResult {
  success: boolean
  totalProcessed: number
  totalImported: number
  totalErrors: number
  errors?: Array<{ row: number; message: string }>
}

export function ImportarUnidadesForm({ empreendimentoId }: ImportarUnidadesFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [csvText, setCsvText] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [activeTab, setActiveTab] = useState<string>("arquivo")
  const router = useRouter()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (
        selectedFile.type !== "text/csv" &&
        !selectedFile.name.endsWith(".csv") &&
        selectedFile.type !== "application/vnd.ms-excel" &&
        selectedFile.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        toast({
          title: "Formato de arquivo inválido",
          description: "Por favor, selecione um arquivo CSV ou Excel (.csv, .xls, .xlsx)",
          variant: "destructive",
        })
        e.target.value = ""
        return
      }
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleCsvTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCsvText(e.target.value)
    setResult(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setProgress(0)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("empreendimentoId", empreendimentoId)

      if (activeTab === "arquivo" && file) {
        formData.append("file", file)
      } else if (activeTab === "texto" && csvText) {
        // Criar um arquivo a partir do texto CSV
        const csvBlob = new Blob([csvText], { type: "text/csv" })
        formData.append("file", csvBlob, "dados-importacao.csv")
      } else {
        throw new Error("Nenhum dado para importação foi fornecido")
      }

      // Simular progresso (em um cenário real, isso viria do servidor)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 300)

      const result = await importarUnidades(formData)

      clearInterval(progressInterval)
      setProgress(100)

      if (result.error) {
        throw new Error(result.error)
      }

      setResult({
        success: true,
        totalProcessed: result.totalProcessed || 0,
        totalImported: result.totalImported || 0,
        totalErrors: result.totalErrors || 0,
        errors: result.errors || [],
      })

      toast({
        title: "Importação concluída",
        description: `${result.totalImported} unidades foram importadas com sucesso.`,
      })
    } catch (error: any) {
      setResult({
        success: false,
        totalProcessed: 0,
        totalImported: 0,
        totalErrors: 1,
        errors: [{ row: 0, message: error.message || "Erro desconhecido durante a importação" }],
      })

      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro ao importar as unidades.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Importação de Unidades</CardTitle>
          <CardDescription className="text-gray-400">
            Importe múltiplas unidades de uma só vez usando um arquivo CSV ou Excel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-gray-800 w-full">
              <TabsTrigger
                value="arquivo"
                className="flex-1 data-[state=active]:bg-aya-green data-[state=active]:text-white"
              >
                Arquivo CSV/Excel
              </TabsTrigger>
              <TabsTrigger
                value="texto"
                className="flex-1 data-[state=active]:bg-aya-green data-[state=active]:text-white"
              >
                Texto CSV
              </TabsTrigger>
              <TabsTrigger
                value="modelo"
                className="flex-1 data-[state=active]:bg-aya-green data-[state=active]:text-white"
              >
                Modelo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="arquivo" className="mt-4">
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg p-12 text-center">
                  <FileSpreadsheet className="h-10 w-10 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-white">Arraste e solte seu arquivo aqui</h3>
                    <p className="text-sm text-gray-400">ou</p>
                    <Label
                      htmlFor="file-upload"
                      className="bg-aya-green hover:bg-opacity-90 text-white py-2 px-4 rounded-md cursor-pointer inline-block"
                    >
                      Selecionar arquivo
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-4">Formatos suportados: CSV, Excel (.csv, .xls, .xlsx)</p>
                </div>

                {file && (
                  <div className="bg-gray-800 p-4 rounded-md flex items-center justify-between">
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-5 w-5 text-aya-green mr-2" />
                      <div>
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-xs text-gray-400">
                          {(file.size / 1024).toFixed(2)} KB • {file.type || "Arquivo CSV/Excel"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      disabled={isLoading}
                      className="text-gray-400 hover:text-white"
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="texto" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-text" className="text-white">
                    Cole o conteúdo CSV abaixo
                  </Label>
                  <Textarea
                    id="csv-text"
                    placeholder="identificador,tipo,area_privativa,pavimento,dormitorios,suites,vagas,orientacao_solar"
                    className="bg-gray-800 border-gray-700 text-white min-h-[200px] font-mono"
                    value={csvText}
                    onChange={handleCsvTextChange}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">A primeira linha deve conter os cabeçalhos das colunas.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="modelo" className="mt-4">
              <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-md">
                  <h3 className="text-lg font-medium text-white mb-2">Modelo de Arquivo</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Seu arquivo CSV ou Excel deve seguir este formato. A primeira linha deve conter os cabeçalhos das
                    colunas.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                      <thead className="text-xs uppercase bg-gray-700 text-gray-300">
                        <tr>
                          <th className="px-4 py-2">Coluna</th>
                          <th className="px-4 py-2">Tipo</th>
                          <th className="px-4 py-2">Obrigatório</th>
                          <th className="px-4 py-2">Descrição</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2 font-medium text-white">identificador</td>
                          <td className="px-4 py-2">Texto</td>
                          <td className="px-4 py-2">Sim</td>
                          <td className="px-4 py-2">Identificador único da unidade (ex: "Apto 101")</td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2 font-medium text-white">tipo</td>
                          <td className="px-4 py-2">Texto</td>
                          <td className="px-4 py-2">Sim</td>
                          <td className="px-4 py-2">Tipo da unidade (ex: "apartamento", "studio", "comercial")</td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2 font-medium text-white">area_privativa</td>
                          <td className="px-4 py-2">Número</td>
                          <td className="px-4 py-2">Sim</td>
                          <td className="px-4 py-2">Área privativa em m²</td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2 font-medium text-white">pavimento</td>
                          <td className="px-4 py-2">Número</td>
                          <td className="px-4 py-2">Não</td>
                          <td className="px-4 py-2">Número do pavimento</td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2 font-medium text-white">dormitorios</td>
                          <td className="px-4 py-2">Número</td>
                          <td className="px-4 py-2">Não</td>
                          <td className="px-4 py-2">Quantidade de dormitórios</td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2 font-medium text-white">suites</td>
                          <td className="px-4 py-2">Número</td>
                          <td className="px-4 py-2">Não</td>
                          <td className="px-4 py-2">Quantidade de suítes</td>
                        </tr>
                        <tr className="border-b border-gray-700">
                          <td className="px-4 py-2 font-medium text-white">vagas</td>
                          <td className="px-4 py-2">Número</td>
                          <td className="px-4 py-2">Não</td>
                          <td className="px-4 py-2">Quantidade de vagas de garagem</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium text-white">orientacao_solar</td>
                          <td className="px-4 py-2">Texto</td>
                          <td className="px-4 py-2">Não</td>
                          <td className="px-4 py-2">Orientação solar (ex: "NORTE", "SUL", "LESTE", "OESTE")</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-md font-medium text-white mb-2">Exemplo:</h4>
                    <pre className="bg-gray-700 p-3 rounded-md overflow-x-auto text-xs text-gray-300">
                      identificador,tipo,area_privativa,pavimento,dormitorios,suites,vagas,orientacao_solar
                      <br />
                      Apto 101,apartamento,65.5,1,2,1,1,LESTE
                      <br />
                      Apto 102,apartamento,75.2,1,3,1,2,OESTE
                      <br />
                      Apto 201,apartamento,65.5,2,2,1,1,LESTE
                      <br />
                      Apto 202,apartamento,75.2,2,3,1,2,OESTE
                    </pre>
                  </div>

                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      onClick={() => {
                        // Criar um arquivo de exemplo para download
                        const csvContent =
                          "identificador,tipo,area_privativa,pavimento,dormitorios,suites,vagas,orientacao_solar\n" +
                          "Apto 101,apartamento,65.5,1,2,1,1,LESTE\n" +
                          "Apto 102,apartamento,75.2,1,3,1,2,OESTE\n" +
                          "Apto 201,apartamento,65.5,2,2,1,1,LESTE\n" +
                          "Apto 202,apartamento,75.2,2,3,1,2,OESTE"

                        const blob = new Blob([csvContent], { type: "text/csv" })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = "modelo-importacao-unidades.csv"
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }}
                    >
                      Baixar modelo CSV
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Processando importação...</span>
                <span className="text-sm text-gray-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className={result.success ? "bg-green-900/20 border-green-800" : undefined}
            >
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle className={result.success ? "text-green-500" : undefined}>
                {result.success ? "Importação concluída" : "Erro na importação"}
              </AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    {result.success
                      ? `${result.totalImported} de ${result.totalProcessed} unidades foram importadas com sucesso.`
                      : "A importação falhou."}
                  </p>
                  {result.totalErrors > 0 && (
                    <div>
                      <p className="font-medium">Erros encontrados ({result.totalErrors}):</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {result.errors?.map((error, index) => (
                          <li key={index} className="text-sm">
                            {error.row > 0 ? `Linha ${error.row}: ` : ""}
                            {error.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-gray-800 bg-gray-900 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            disabled={isLoading}
            onClick={() => router.back()}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            className="bg-aya-green hover:bg-opacity-90"
            disabled={isLoading || (activeTab === "arquivo" && !file) || (activeTab === "texto" && !csvText)}
          >
            {isLoading ? (
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
    </form>
  )
}
