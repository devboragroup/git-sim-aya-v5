"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientClient } from "@/lib/supabase/client"

export function AuthDebugger() {
  const { user, session, isLoading, error } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)

  // Apenas mostrar em ambiente de desenvolvimento
  if (process.env.NODE_ENV === "production") {
    return null
  }

  const checkSupabaseConnection = async () => {
    try {
      setConnectionStatus("Verificando conexão...")
      const supabase = createClientClient()
      const { data, error } = await supabase.from("parametros_precificacao").select("id").limit(1)

      if (error) {
        setConnectionStatus(`Erro de conexão: ${error.message}`)
      } else {
        setConnectionStatus(`Conexão bem-sucedida! ${data ? data.length : 0} registros encontrados.`)
      }
    } catch (err) {
      setConnectionStatus(`Erro ao testar conexão: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <Card className="mt-4 border-dashed border-yellow-300 bg-yellow-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          <span>Depurador de Autenticação</span>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-6 text-xs">
            {isExpanded ? "Ocultar" : "Expandir"}
          </Button>
        </CardTitle>
        <CardDescription className="text-xs">
          Informações de depuração (apenas visível em desenvolvimento)
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent className="text-xs space-y-2">
          <div>
            <strong>Status:</strong> {isLoading ? "Carregando..." : "Pronto"}
          </div>
          <div>
            <strong>Usuário:</strong> {user ? `${user.email} (${user.id})` : "Nenhum"}
          </div>
          <div>
            <strong>Sessão:</strong> {session ? "Ativa" : "Inativa"}
          </div>
          {error && (
            <div className="text-red-500">
              <strong>Erro:</strong> {error.message}
            </div>
          )}
          <div>
            <strong>Conexão Supabase:</strong> {connectionStatus || "Não verificada"}
          </div>
        </CardContent>
      )}

      {isExpanded && (
        <CardFooter className="pt-0">
          <Button variant="outline" size="sm" className="text-xs w-full" onClick={checkSupabaseConnection}>
            Testar Conexão Supabase
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
