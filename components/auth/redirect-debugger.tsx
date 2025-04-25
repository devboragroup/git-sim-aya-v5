"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowRight } from "lucide-react"

export function RedirectDebugger() {
  const [redirectAttempts, setRedirectAttempts] = useState(0)
  const [redirectError, setRedirectError] = useState<string | null>(null)
  const [routerInfo, setRouterInfo] = useState<any>({})
  const [windowLocation, setWindowLocation] = useState<string>("")
  const [environmentVars, setEnvironmentVars] = useState<{ [key: string]: string | undefined }>({})

  useEffect(() => {
    // Capturar informações sobre a localização atual
    if (typeof window !== "undefined") {
      setWindowLocation(window.location.href)
    }

    // Extrair informações do router
    setRouterInfo({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
    })

    // Verificar variáveis de ambiente relevantes
    setEnvironmentVars({
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NODE_ENV: process.env.NODE_ENV,
    })
  }, [])

  // Função para tentar redirecionamento usando window.location
  const handleWindowLocation = (path: string) => {
    try {
      setRedirectAttempts((prev) => prev + 1)
      console.log("Tentando redirecionamento via window.location para", path)
      window.location.href = path
    } catch (error) {
      console.error("Erro ao redirecionar via window.location:", error)
      setRedirectError(`window.location error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-4 border-orange-300 bg-orange-50">
      <CardHeader className="bg-orange-100">
        <CardTitle className="text-orange-800">Diagnóstico de Redirecionamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <h3 className="font-medium">Informações do Ambiente:</h3>
          <p className="text-sm text-gray-600">URL atual: {windowLocation}</p>
          <p className="text-sm text-gray-600">Pathname: {routerInfo.pathname}</p>
          <p className="text-sm text-gray-600">Tentativas de redirecionamento: {redirectAttempts}</p>
          <p className="text-sm text-gray-600">
            NEXT_PUBLIC_SITE_URL: {environmentVars.NEXT_PUBLIC_SITE_URL || "Não definido"}
          </p>
        </div>

        {redirectError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro de redirecionamento</AlertTitle>
            <AlertDescription>{redirectError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h3 className="font-medium">Redirecionamento Manual:</h3>
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => handleWindowLocation("/dashboard")}
              variant="outline"
              className="w-full justify-start"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Ir para Dashboard
            </Button>
            <Button onClick={() => handleWindowLocation("/login")} variant="outline" className="w-full justify-start">
              <ArrowRight className="mr-2 h-4 w-4" />
              Ir para Login
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
