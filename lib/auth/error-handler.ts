import { AuthError } from "@supabase/supabase-js"

// Tipos de erros de autenticação
export enum AuthErrorType {
  INVALID_CREDENTIALS = "invalid_credentials",
  RATE_LIMITED = "rate_limited",
  EMAIL_NOT_CONFIRMED = "email_not_confirmed",
  ACCOUNT_LOCKED = "account_locked",
  NETWORK_ERROR = "network_error",
  SERVER_ERROR = "server_error",
  EXPIRED_SESSION = "expired_session",
  INVALID_MFA = "invalid_mfa",
  REDIRECT_ERROR = "redirect_error", // Tipo específico para erros de redirecionamento
  UNKNOWN = "unknown",
}

// Interface para o resultado do tratamento de erro
export interface AuthErrorResult {
  type: AuthErrorType
  message: string
  technicalDetails?: string
  suggestedAction?: string
  statusCode?: number
  retryable: boolean
  redirectUrl?: string // Para armazenar a URL de redirecionamento
}

/**
 * Analisa e classifica erros de autenticação do Supabase e outros erros
 */
export function handleAuthError(error: unknown): AuthErrorResult {
  // Verificar se é um erro de redirecionamento do Next.js
  if (
    error instanceof Error &&
    (error.name === "RedirectError" || error.message.includes("NEXT_REDIRECT") || error.message === "Redirect")
  ) {
    // Tentar extrair a URL de redirecionamento da mensagem de erro
    let redirectUrl = "/dashboard" // URL padrão
    const urlMatch = error.message.match(/to\s+"([^"]+)"/)
    if (urlMatch && urlMatch[1]) {
      redirectUrl = urlMatch[1]
    }

    return {
      type: AuthErrorType.REDIRECT_ERROR,
      message: "Redirecionamento em andamento",
      technicalDetails: error.message,
      suggestedAction: `Clique aqui para continuar para ${redirectUrl}`,
      retryable: false,
      redirectUrl: redirectUrl,
    }
  }

  // Caso seja um erro do Supabase
  if (error instanceof AuthError) {
    return handleSupabaseAuthError(error)
  }

  // Caso seja um erro de rede
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      type: AuthErrorType.NETWORK_ERROR,
      message: "Não foi possível conectar ao servidor de autenticação",
      technicalDetails: error.message,
      suggestedAction: "Verifique sua conexão com a internet e tente novamente",
      retryable: true,
    }
  }

  // Para outros tipos de erro
  return {
    type: AuthErrorType.UNKNOWN,
    message: "Ocorreu um erro desconhecido durante a autenticação",
    technicalDetails: error instanceof Error ? error.message : String(error),
    suggestedAction: "Tente novamente mais tarde ou entre em contato com o suporte",
    retryable: true,
  }
}

/**
 * Trata especificamente erros de autenticação do Supabase
 */
function handleSupabaseAuthError(error: AuthError): AuthErrorResult {
  // Implementação existente...
  // Extrair código de status se disponível
  const statusCode = error.status || undefined

  // Classificar com base no código e mensagem
  if (error.message.includes("Invalid login credentials")) {
    return {
      type: AuthErrorType.INVALID_CREDENTIALS,
      message: "Email ou senha incorretos",
      technicalDetails: error.message,
      suggestedAction: "Verifique suas credenciais e tente novamente",
      statusCode,
      retryable: true,
    }
  }

  if (error.message.includes("Email not confirmed")) {
    return {
      type: AuthErrorType.EMAIL_NOT_CONFIRMED,
      message: "Email não confirmado",
      technicalDetails: error.message,
      suggestedAction: "Verifique sua caixa de entrada para confirmar seu email",
      statusCode,
      retryable: false,
    }
  }

  if (error.message.includes("Too many requests")) {
    return {
      type: AuthErrorType.RATE_LIMITED,
      message: "Muitas tentativas de login",
      technicalDetails: error.message,
      suggestedAction: "Aguarde alguns minutos antes de tentar novamente",
      statusCode,
      retryable: false,
    }
  }

  if (error.message.includes("User is locked")) {
    return {
      type: AuthErrorType.ACCOUNT_LOCKED,
      message: "Conta bloqueada por motivos de segurança",
      technicalDetails: error.message,
      suggestedAction: "Entre em contato com o administrador do sistema",
      statusCode,
      retryable: false,
    }
  }

  if (error.status >= 500) {
    return {
      type: AuthErrorType.SERVER_ERROR,
      message: "Erro no servidor de autenticação",
      technicalDetails: error.message,
      suggestedAction: "Tente novamente mais tarde",
      statusCode,
      retryable: true,
    }
  }

  if (error.message.includes("JWT expired")) {
    return {
      type: AuthErrorType.EXPIRED_SESSION,
      message: "Sua sessão expirou",
      technicalDetails: error.message,
      suggestedAction: "Faça login novamente",
      statusCode,
      retryable: true,
    }
  }

  // Erro desconhecido do Supabase
  return {
    type: AuthErrorType.UNKNOWN,
    message: "Erro de autenticação",
    technicalDetails: error.message,
    suggestedAction: "Tente novamente ou entre em contato com o suporte",
    statusCode,
    retryable: true,
  }
}

/**
 * Registra erros de autenticação para análise
 */
export function logAuthError(error: unknown, context: { email?: string; action: string; attemptCount?: number }): void {
  const errorResult = error instanceof AuthError ? handleSupabaseAuthError(error) : handleAuthError(error)

  // Não logar erros de redirecionamento como erros críticos
  const logLevel = errorResult.type === AuthErrorType.REDIRECT_ERROR ? "info" : "error"

  console[logLevel](
    `[AUTH ${logLevel.toUpperCase()}] ${context.action} | Type: ${errorResult.type} | ` +
      `Email: ${context.email || "N/A"} | Attempt: ${context.attemptCount || 1} | ` +
      `Message: ${errorResult.message} | Details: ${errorResult.technicalDetails || "N/A"}`,
  )
}
