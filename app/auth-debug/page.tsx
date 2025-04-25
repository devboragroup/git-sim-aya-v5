"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCcw } from "lucide-react"
import { createClientClient } from "@/lib/supabase/client"

export default function AuthDebugPage() {
  const { user, session, isLoading, error, authStatus, lastAuthAction } = useAuth()
  const [cookies, setCookies] = useState<string[]>([])
  const [localStorageItems, setLocalStorageItems] = useState<string[]>([])
  const [supabaseStatus, setSupabaseStatus] = useState<"checking" | "ok" | "error">("checking")
  const [supabaseError, setSupabaseError] = useState<string | null>(null)

  useEffect(() => {
    // Verificar cookies
    if (typeof document !== "undefined") {
      setCookies(document.cookie.split(";").map((c) => c.trim()))
    }

    // Verificar localStorage
    if (typeof window !== "undefined") {
      const items: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          items.push(key)
        }
      }
      setLocalStorageItems(items)
    }

    // Verificar conexão com Supabase
    const checkSupabase = async () => {
      try {
        const supabase = createClientClient()
        const { error } = await supabase.from("parametros_precificacao").select("count()", { count: "exact" }).limit(1)

        if (error) {
          setSupabaseStatus("error")
          setSupabaseError(error.message)
        } else {
          setSupabaseStatus("ok")
        }
      } catch (err) {
        setSupabaseStatus("error")
        setSupabaseError(err instanceof Error ? err.message : String(err))
      }
    }

    checkSupabase()
  }, [])

  const handleTestRedirect = () => {
    window.location.href = "/dashboard"
  }

  const handleClearStorage = () => {
    if (typeof window !== "undefined") {
      localStorage.clear()
      sessionStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Autenticação</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado da Autenticação</CardTitle>
            <CardDescription>Informações sobre o estado atual da autenticação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">
                Status: <span className="font-normal">{authStatus}</span>
              </p>
              <p className="font-medium">
                Carregando: <span className="font-normal">{isLoading ? "Sim" : "Não"}</span>
              </p>
              <p className="font-medium">
                Última ação: <span className="font-normal">{lastAuthAction || "Nenhuma"}</span>
              </p>
              <p className="font-medium">
                Usuário: <span className="font-normal">{user ? user.email : "Não autenticado"}</span>
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro de autenticação</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            {session && (
              <div>
                <p className="font-medium">Sessão expira em:</p>
                <p className="text-sm">{new Date(session.expires_at! * 1000).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ambiente</CardTitle>
            <CardDescription>Informações sobre o ambiente do navegador</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">
                URL atual:{" "}
                <span className="font-normal">{typeof window !== "undefined" ? window.location.href : ""}</span>
              </p>
              <p className="font-medium">
                Conexão Supabase:{" "}
                <span className="font-normal">
                  {supabaseStatus === "checking" ? "Verificando..." : supabaseStatus === "ok" ? "OK" : "Erro"}
                </span>
              </p>
              {supabaseError && <p className="text-red-500 text-sm">{supabaseError}</p>}
            </div>

            <div>
              <p className="font-medium">Cookies ({cookies.length}):</p>
              <ul className="text-sm list-disc pl-5">
                {cookies.map((cookie, index) => (
                  <li key={index}>{cookie}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-medium">LocalStorage ({localStorageItems.length}):</p>
              <ul className="text-sm list-disc pl-5">
                {localStorageItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <Button onClick={handleTestRedirect} variant="default">
          Testar Redirecionamento
        </Button>
        <Button onClick={handleClearStorage} variant="destructive">
          Limpar Storage
        </Button>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Recarregar Página
        </Button>
      </div>
    </div>
  )
}
