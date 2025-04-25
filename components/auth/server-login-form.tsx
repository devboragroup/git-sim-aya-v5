"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { serverLogin } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { AuthErrorFeedback } from "@/components/auth/auth-error-feedback"
import { AuthErrorType } from "@/lib/auth/error-handler"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export function ServerLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorType, setErrorType] = useState<AuthErrorType | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [suggestedAction, setSuggestedAction] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()
  const { refreshSession } = useAuth()

  // Função para limpar erros
  const clearErrors = () => {
    setErrorType(null)
    setErrorMessage(null)
    setSuggestedAction(null)
    setRedirectUrl(null)
  }

  // Função para lidar com o envio do formulário
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearErrors()
    setSuccess(false)

    if (!email || !password) {
      setErrorType(AuthErrorType.INVALID_CREDENTIALS)
      setErrorMessage("Email e senha são obrigatórios")
      return
    }

    // Criar FormData para enviar para a Server Action
    const formData = new FormData()
    formData.append("email", email)
    formData.append("password", password)

    // Adicionar parâmetro redirectTo se existir na URL
    const urlParams = new URLSearchParams(window.location.search)
    const redirectTo = urlParams.get("redirectTo")
    if (redirectTo) {
      formData.append("redirectTo", redirectTo)
    }

    console.log("[ServerLoginForm] Iniciando processo de login para:", email)

    // Usar startTransition para indicar que a operação está em andamento
    startTransition(async () => {
      try {
        // A Server Action irá redirecionar automaticamente em caso de sucesso
        // Se retornar algo, significa que houve um erro ou um redirecionamento falhou
        const result = await serverLogin(formData)

        console.log("[ServerLoginForm] Resultado do serverLogin:", result)

        if (result.success) {
          // Login bem-sucedido
          setSuccess(true)

          // Atualizar a sessão no contexto de autenticação
          console.log("[ServerLoginForm] Atualizando sessão após login bem-sucedido")
          try {
            await refreshSession()
          } catch (refreshError) {
            console.error("[ServerLoginForm] Erro ao atualizar sessão:", refreshError)
            // Continuar mesmo se houver erro ao atualizar a sessão
          }

          // Se temos uma URL de redirecionamento, armazená-la
          if (result.redirectTo) {
            setRedirectUrl(result.redirectTo)
          }

          toast({
            title: "Login bem-sucedido",
            description: "Você será redirecionado para o dashboard",
          })

          // Se houver um erro de redirecionamento, mostrar mensagem apropriada
          if (result.error && result.error.type === AuthErrorType.REDIRECT_ERROR) {
            setErrorType(AuthErrorType.REDIRECT_ERROR)
            setErrorMessage(result.error.message || "Erro no redirecionamento")
            setSuggestedAction(result.error.suggestedAction || "Clique no botão para continuar")
            if (result.error.redirectUrl) {
              setRedirectUrl(result.error.redirectUrl)
            }
          } else {
            // Tentativa de redirecionamento do lado do cliente como fallback
            setTimeout(() => {
              try {
                console.log(
                  "[ServerLoginForm] Tentando redirecionamento automático para:",
                  result.redirectTo || redirectTo || "/dashboard",
                )
                // Atualizar a sessão antes de redirecionar
                refreshSession().then(() => {
                  router.push(result.redirectTo || redirectTo || "/dashboard")
                  router.refresh()
                })
              } catch (e) {
                console.error("[ServerLoginForm] Erro no redirecionamento do cliente:", e)
                // Se falhar, oferecer redirecionamento manual
                setErrorType(AuthErrorType.REDIRECT_ERROR)
                setErrorMessage("Erro no redirecionamento automático")
                setSuggestedAction("Clique no botão para continuar manualmente")
              }
            }, 1000) // Aumentado para 1 segundo para dar tempo ao refreshSession
          }
        } else if (result && !result.success && result.error) {
          // Login falhou
          console.error("[ServerLoginForm] Erro no login:", result.error)
          setErrorType(result.error.type)
          setErrorMessage(result.error.message)
          setSuggestedAction(result.error.suggestedAction || null)

          // Se houver uma URL de redirecionamento no erro, armazená-la
          if (result.error.redirectUrl) {
            setRedirectUrl(result.error.redirectUrl)
          }

          toast({
            title: "Erro ao fazer login",
            description: result.error.message,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("[ServerLoginForm] Erro ao processar login:", error)

        // Tentar identificar se é um erro de redirecionamento
        const isRedirectError =
          error instanceof Error &&
          (error.message === "Redirect" || error.message.includes("NEXT_REDIRECT") || error.name === "RedirectError")

        if (isRedirectError) {
          // É um erro de redirecionamento, tratar como sucesso
          console.log("[ServerLoginForm] Detectado erro de redirecionamento, tratando como sucesso")
          setSuccess(true)
          setRedirectUrl("/dashboard")

          // Atualizar a sessão no contexto de autenticação
          try {
            await refreshSession()
          } catch (refreshError) {
            console.error("[ServerLoginForm] Erro ao atualizar sessão após redirecionamento:", refreshError)
            // Continuar mesmo se houver erro ao atualizar a sessão
          }

          toast({
            title: "Login bem-sucedido",
            description: "Você será redirecionado para o dashboard",
          })

          // Tentar redirecionamento manual após um curto delay
          setTimeout(() => {
            handleManualRedirect()
          }, 1000)
        } else {
          // Outro tipo de erro
          setErrorType(AuthErrorType.UNKNOWN)
          setErrorMessage(error instanceof Error ? error.message : "Erro desconhecido durante o login")

          toast({
            title: "Erro ao fazer login",
            description: error instanceof Error ? error.message : "Erro desconhecido durante o login",
            variant: "destructive",
          })
        }
      }
    })
  }

  // Função para tentar novamente após um erro
  const handleRetry = () => {
    clearErrors()
    // Não limpa os campos para facilitar nova tentativa
  }

  // Função para dispensar o erro
  const handleDismiss = () => {
    clearErrors()
  }

  // Função para tentar redirecionamento manual
  const handleManualRedirect = () => {
    try {
      console.log("[ServerLoginForm] Tentativa de redirecionamento manual")
      const url = redirectUrl || new URLSearchParams(window.location.search).get("redirectTo") || "/dashboard"
      console.log("[ServerLoginForm] Redirecionando para:", url)

      // Atualizar a sessão antes de redirecionar
      refreshSession()
        .then(() => {
          window.location.href = url
        })
        .catch((error) => {
          console.error("[ServerLoginForm] Erro ao atualizar sessão antes do redirecionamento manual:", error)
          // Continuar com o redirecionamento mesmo se houver erro
          window.location.href = url
        })
    } catch (e) {
      console.error("[ServerLoginForm] Erro no redirecionamento manual:", e)
      setErrorMessage(`Erro no redirecionamento: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div className="grid gap-6">
      {errorType && errorMessage && errorType !== AuthErrorType.REDIRECT_ERROR && (
        <AuthErrorFeedback
          errorType={errorType}
          message={errorMessage}
          suggestedAction={suggestedAction || undefined}
          onRetry={handleRetry}
          onDismiss={handleDismiss}
        />
      )}

      {success && (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="space-y-2">
            <p>
              Login bem-sucedido.{" "}
              {errorType === AuthErrorType.REDIRECT_ERROR
                ? "Ocorreu um problema no redirecionamento automático."
                : "Você será redirecionado para o dashboard em instantes."}
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                onClick={handleManualRedirect}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {errorType === AuthErrorType.REDIRECT_ERROR
                  ? "Clique aqui para continuar"
                  : "Clique aqui se não for redirecionado automaticamente"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <Input
              id="email"
              placeholder="nome@exemplo.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isPending || success}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-white">
                Senha
              </Label>
              <Button variant="link" className="h-auto p-0 text-sm text-aya-green" asChild>
                <Link href="/esqueci-senha">Esqueceu a senha?</Link>
              </Button>
            </div>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              disabled={isPending || success}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <Button type="submit" disabled={isPending || success} className="bg-aya-green hover:bg-opacity-90 text-white">
            {isPending && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </div>
      </form>

      <div className="text-center text-sm text-gray-400">
        <p>Status do sistema: {process.env.NODE_ENV === "production" ? "Produção" : "Desenvolvimento"}</p>
      </div>
    </div>
  )
}
