"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCcw } from "lucide-react"
import { createClientClient } from "@/lib/supabase/client"

export function AuthDebugUtils() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkEnvironment = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Verificar variáveis de ambiente
      const envInfo = {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Definido" : "Não definido",
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ? "Definido" : "Não definido",
      }

      // Verificar conexão com Supabase
      const supabase = createClientClient()
      let supabaseStatus = "Erro ao conectar"

      try {
        const { error } = await supabase.from("parametros_precificacao").select("count()", { count: "exact" }).limit(1)
        supabaseStatus = error ? `Erro: ${error.message}` : "Conectado com sucesso"
      } catch (e) {
        supabaseStatus = `Erro: ${e instanceof Error ? e.message : String(e)}`
      }

      // Verificar cookies
      const cookies = document.cookie.split(";").map((c) => c.trim())

      // Verificar localStorage
      const localStorageItems = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          localStorageItems.push(key)
        }
      }

      setDebugInfo({
        environment: envInfo,
        supabaseStatus,
        cookies,
        localStorageItems,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      })
    } catch (e) {
      setError(`Erro ao coletar informações de depuração: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Ferramentas de Depuração de Autenticação</CardTitle>
        <CardDescription>Colete informações para diagnosticar problemas de autenticação</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {debugInfo && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Ambiente:</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto mt-1">
                {JSON.stringify(debugInfo.environment, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-medium">Status do Supabase:</h3>
              <p className="text-sm">{debugInfo.supabaseStatus}</p>
            </div>

            <div>
              <h3 className="font-medium">Cookies ({debugInfo.cookies.length}):</h3>
              <ul className="text-xs list-disc pl-5">
                {debugInfo.cookies.map((cookie: string, index: number) => (
                  <li key={index}>{cookie}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium">LocalStorage ({debugInfo.localStorageItems.length}):</h3>
              <ul className="text-xs list-disc pl-5">
                {debugInfo.localStorageItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium">Informações do Navegador:</h3>
              <p className="text-xs break-words">{debugInfo.userAgent}</p>
              <p className="text-xs break-words mt-1">URL: {debugInfo.url}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={checkEnvironment} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              Coletando informações...
            </>
          ) : (
            "Coletar Informações de Depuração"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
