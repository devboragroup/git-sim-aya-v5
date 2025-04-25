/**
 * Utilitários para depuração de autenticação
 */

/**
 * Verifica se o ambiente atual é de desenvolvimento
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development"
}

/**
 * Registra informações de depuração apenas em ambiente de desenvolvimento
 */
export function debugLog(message: string, data?: any): void {
  if (isDevelopment()) {
    console.log(`[AUTH DEBUG] ${message}`, data || "")
  }
}

/**
 * Verifica se a URL do site está configurada corretamente
 */
export function checkSiteUrl(): { valid: boolean; url: string | null; issues: string[] } {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const issues: string[] = []

  if (!siteUrl) {
    issues.push("NEXT_PUBLIC_SITE_URL não está definido")
    return { valid: false, url: null, issues }
  }

  try {
    const url = new URL(siteUrl)

    if (!url.protocol.startsWith("http")) {
      issues.push(`Protocolo inválido: ${url.protocol}`)
    }

    return {
      valid: issues.length === 0,
      url: siteUrl,
      issues,
    }
  } catch (error) {
    issues.push(`URL inválida: ${error instanceof Error ? error.message : String(error)}`)
    return { valid: false, url: siteUrl, issues }
  }
}

/**
 * Verifica se as variáveis de ambiente necessárias para autenticação estão configuradas
 */
export function checkAuthEnvironment(): { valid: boolean; issues: string[] } {
  const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SITE_URL"]

  const issues: string[] = []

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      issues.push(`${varName} não está definido`)
    }
  }

  // Verificar URL do site
  const siteUrlCheck = checkSiteUrl()
  if (!siteUrlCheck.valid) {
    issues.push(...siteUrlCheck.issues)
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
