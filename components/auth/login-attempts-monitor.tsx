"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface LoginAttempt {
  id: string
  email: string
  timestamp: string
  success: boolean
  errorType?: string
  ipAddress?: string
  userAgent?: string
}

export function LoginAttemptsMonitor() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttempts = async () => {
    setLoading(true)
    setError(null)

    try {
      // Em um ambiente real, isso seria uma chamada de API para buscar tentativas de login
      // Por enquanto, vamos simular alguns dados
      const mockAttempts: LoginAttempt[] = [
        {
          id: "1",
          email: "usuario@exemplo.com",
          timestamp: new Date().toISOString(),
          success: false,
          errorType: "INVALID_CREDENTIALS",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        {
          id: "2",
          email: "admin@exemplo.com",
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          success: true,
          ipAddress: "192.168.1.2",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        },
        {
          id: "3",
          email: "usuario@exemplo.com",
          timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
          success: false,
          errorType: "RATE_LIMITED",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      ]

      setAttempts(mockAttempts)
    } catch (err) {
      setError("Erro ao carregar tentativas de login")
      console.error("Erro ao carregar tentativas de login:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttempts()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Monitoramento de Tentativas de Login</h2>
        <Button variant="outline" size="sm" onClick={fetchAttempts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <Table>
        <TableCaption>Histórico recente de tentativas de login</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tipo de Erro</TableHead>
            <TableHead>Endereço IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.map((attempt) => (
            <TableRow key={attempt.id}>
              <TableCell className="font-medium">{attempt.email}</TableCell>
              <TableCell>{formatDate(attempt.timestamp)}</TableCell>
              <TableCell>
                {attempt.success ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Sucesso
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Falha
                  </Badge>
                )}
              </TableCell>
              <TableCell>{attempt.errorType || "-"}</TableCell>
              <TableCell>{attempt.ipAddress}</TableCell>
            </TableRow>
          ))}
          {attempts.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                Nenhuma tentativa de login registrada
              </TableCell>
            </TableRow>
          )}
          {loading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                <div className="flex justify-center">
                  <Spinner className="h-6 w-6 animate-spin" />
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
