"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, RefreshCcw } from "lucide-react"

export function AuthStatusTester() {
  const [status, setStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAuthStatus = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/status")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Erro ao verificar status de autenticação:", error)
      setError(error instanceof Error ? error.message : "Erro ao verificar status de autenticação")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Teste de Status de Autenticação</CardTitle>
        <CardDescription>Verifique o status atual da sua autenticação</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status && (
          <div className="space-y-4">
            <Alert variant={status.authenticated ? "default" : "warning"} className="mb-4">
              {status.authenticated ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>Status</AlertTitle>
              <AlertDescription>{status.authenticated ? "Autenticado" : "Não autenticado"}</AlertDescription>
            </Alert>

            {status.user && (
              <div className="space-y-2">
                <h3 className="font-medium">Informações do Usuário:</h3>
                <p className="text-sm">Email: {status.user.email}</p>
                <p className="text-sm">ID: {status.user.id}</p>
                <p className="text-sm">Último login: {new Date(status.user.last_sign_in_at).toLocaleString()}</p>
              </div>
            )}

            {status.session && (
              <div className="space-y-2">
                <h3 className="font-medium">Informações da Sessão:</h3>
                <p className="text-sm">Expira em: {new Date(status.session.expires_at * 1000).toLocaleString()}</p>
                <p className="text-sm">Criada em: {new Date(status.session.created_at * 1000).toLocaleString()}</p>
              </div>
            )}

            {status.cookies && (
              <div className="space-y-2">
                <h3 className="font-medium">Cookies ({status.cookies.count}):</h3>
                <ul className="text-sm list-disc pl-5">
                  {status.cookies.names.map((name: string, index: number) => (
                    <li key={index}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={checkAuthStatus} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar Status de Autenticação"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
