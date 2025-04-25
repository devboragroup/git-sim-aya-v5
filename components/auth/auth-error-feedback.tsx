"use client"

import { AlertCircle, AlertTriangle, Info, XCircle, HelpCircle, ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AuthErrorType } from "@/lib/auth/error-handler"
import { Button } from "@/components/ui/button"

interface AuthErrorFeedbackProps {
  errorType: AuthErrorType
  message: string
  suggestedAction?: string
  redirectUrl?: string
  onRetry?: () => void
  onDismiss?: () => void
  onRedirect?: (url: string) => void
}

export function AuthErrorFeedback({
  errorType,
  message,
  suggestedAction,
  redirectUrl,
  onRetry,
  onDismiss,
  onRedirect,
}: AuthErrorFeedbackProps) {
  // Determinar o ícone e a variante com base no tipo de erro
  const getIconAndVariant = () => {
    switch (errorType) {
      case AuthErrorType.INVALID_CREDENTIALS:
        return { icon: <XCircle className="h-4 w-4" />, variant: "destructive" as const }
      case AuthErrorType.RATE_LIMITED:
        return { icon: <AlertTriangle className="h-4 w-4" />, variant: "warning" as const }
      case AuthErrorType.NETWORK_ERROR:
        return { icon: <AlertCircle className="h-4 w-4" />, variant: "destructive" as const }
      case AuthErrorType.SERVER_ERROR:
        return { icon: <AlertCircle className="h-4 w-4" />, variant: "destructive" as const }
      case AuthErrorType.EMAIL_NOT_CONFIRMED:
        return { icon: <Info className="h-4 w-4" />, variant: "info" as const }
      case AuthErrorType.ACCOUNT_LOCKED:
        return { icon: <AlertTriangle className="h-4 w-4" />, variant: "warning" as const }
      case AuthErrorType.REDIRECT_ERROR:
        return { icon: <ExternalLink className="h-4 w-4" />, variant: "default" as const }
      default:
        return { icon: <HelpCircle className="h-4 w-4" />, variant: "default" as const }
    }
  }

  const { icon, variant } = getIconAndVariant()

  // Determinar o título com base no tipo de erro
  const getTitle = () => {
    switch (errorType) {
      case AuthErrorType.INVALID_CREDENTIALS:
        return "Credenciais inválidas"
      case AuthErrorType.RATE_LIMITED:
        return "Muitas tentativas"
      case AuthErrorType.NETWORK_ERROR:
        return "Erro de conexão"
      case AuthErrorType.SERVER_ERROR:
        return "Erro no servidor"
      case AuthErrorType.EMAIL_NOT_CONFIRMED:
        return "Email não confirmado"
      case AuthErrorType.ACCOUNT_LOCKED:
        return "Conta bloqueada"
      case AuthErrorType.EXPIRED_SESSION:
        return "Sessão expirada"
      case AuthErrorType.REDIRECT_ERROR:
        return "Erro de redirecionamento"
      default:
        return "Erro de autenticação"
    }
  }

  // Verificar se o erro é retentável
  const isRetryable = [
    AuthErrorType.INVALID_CREDENTIALS,
    AuthErrorType.NETWORK_ERROR,
    AuthErrorType.SERVER_ERROR,
    AuthErrorType.UNKNOWN,
    AuthErrorType.EXPIRED_SESSION,
  ].includes(errorType)

  // Função para lidar com redirecionamento manual
  const handleRedirect = () => {
    if (redirectUrl) {
      if (onRedirect) {
        onRedirect(redirectUrl)
      } else {
        window.location.href = redirectUrl
      }
    }
  }

  return (
    <Alert variant={variant} className="mb-4">
      {icon}
      <AlertTitle>{getTitle()}</AlertTitle>
      <AlertDescription>
        <p className="mb-2">{message}</p>
        {suggestedAction && <p className="text-sm opacity-80">{suggestedAction}</p>}

        <div className="mt-3 flex gap-2">
          {isRetryable && onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Tentar novamente
            </Button>
          )}
          {redirectUrl && (
            <Button size="sm" variant="outline" onClick={handleRedirect}>
              Continuar para {redirectUrl.split("/").pop() || "página"}
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Fechar
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
