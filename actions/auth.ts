"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { handleAuthError, logAuthError, AuthErrorType } from "@/lib/auth/error-handler"

// Interface para o resultado da autenticação
export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
  }
  error?: {
    type: AuthErrorType
    message: string
    suggestedAction?: string
    redirectUrl?: string
  }
  redirectTo?: string
}

// Contador de tentativas de login por email (em memória - será resetado em deploys)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

// Limite de tentativas de login
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutos em milissegundos

/**
 * Server Action para realizar login
 * Esta função é executada no servidor e garante um redirecionamento confiável
 */
export async function serverLogin(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const redirectTo = (formData.get("redirectTo") as string) || "/dashboard"

  console.log(`[Auth Server Action] Tentativa de login para: ${email}, redirecionamento para: ${redirectTo}`)

  if (!email || !password) {
    return {
      success: false,
      error: {
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: "Email e senha são obrigatórios",
      },
    }
  }

  // Verificar tentativas de login
  const userAttempts = loginAttempts.get(email)
  const now = Date.now()

  if (userAttempts) {
    // Verificar se o usuário está em período de bloqueio
    if (userAttempts.count >= MAX_LOGIN_ATTEMPTS) {
      const timeElapsed = now - userAttempts.lastAttempt

      if (timeElapsed < LOCKOUT_DURATION) {
        const minutesLeft = Math.ceil((LOCKOUT_DURATION - timeElapsed) / 60000)

        return {
          success: false,
          error: {
            type: AuthErrorType.RATE_LIMITED,
            message: `Muitas tentativas de login. Conta temporariamente bloqueada.`,
            suggestedAction: `Tente novamente em ${minutesLeft} minutos ou redefina sua senha.`,
          },
        }
      } else {
        // Resetar contador após o período de bloqueio
        loginAttempts.set(email, { count: 1, lastAttempt: now })
      }
    } else {
      // Incrementar contador de tentativas
      loginAttempts.set(email, {
        count: userAttempts.count + 1,
        lastAttempt: now,
      })
    }
  } else {
    // Primeira tentativa para este email
    loginAttempts.set(email, { count: 1, lastAttempt: now })
  }

  try {
    const supabase = createServerClient()

    // Verificar se o usuário já está autenticado
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session) {
      // Usuário já está autenticado, apenas redirecionar
      console.log("[Auth Server Action] Usuário já autenticado, redirecionando para", redirectTo)

      // Revalidar caminhos
      revalidatePath("/dashboard")
      revalidatePath("/")

      // Definir um cookie especial para sinalizar ao cliente que deve atualizar sua sessão
      try {
        cookies().set("auth_redirect", "true", {
          path: "/",
          maxAge: 60, // Aumentado para 60 segundos para garantir que o cliente tenha tempo de processar
          httpOnly: false, // Precisa ser acessível via JavaScript
          sameSite: "strict",
        })
      } catch (cookieError) {
        console.error("[Auth Server Action] Erro ao definir cookie:", cookieError)
        // Continuar mesmo se houver erro ao definir o cookie
      }

      try {
        redirect(redirectTo)
      } catch (redirectError) {
        // Tratar erro de redirecionamento
        console.log("[Auth Server Action] Erro ao redirecionar usuário já autenticado:", redirectError)
        return {
          success: true,
          redirectTo: redirectTo,
          user: {
            id: sessionData.session.user.id,
            email: sessionData.session.user.email || "",
          },
        }
      }
    }

    // Tentativa de login
    console.log("[Auth Server Action] Realizando login com Supabase")
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Processar o erro usando nosso utilitário
      const errorResult = handleAuthError(error)
      console.error("[Auth Server Action] Erro de autenticação:", error.message)

      // Registrar o erro para análise
      logAuthError(error, {
        email,
        action: "serverLogin",
        attemptCount: loginAttempts.get(email)?.count,
      })

      return {
        success: false,
        error: {
          type: errorResult.type,
          message: errorResult.message,
          suggestedAction: errorResult.suggestedAction,
        },
      }
    }

    if (!data.user) {
      console.error("[Auth Server Action] Login bem-sucedido, mas usuário não encontrado")
      return {
        success: false,
        error: {
          type: AuthErrorType.UNKNOWN,
          message: "Usuário não encontrado",
        },
      }
    }

    // Login bem-sucedido - resetar contador de tentativas
    loginAttempts.delete(email)
    console.log("[Auth Server Action] Login bem-sucedido para:", data.user.email)

    // Definir um cookie especial para sinalizar ao cliente que deve atualizar sua sessão
    try {
      cookies().set("auth_redirect", "true", {
        path: "/",
        maxAge: 60, // Aumentado para 60 segundos
        httpOnly: false, // Precisa ser acessível via JavaScript
        sameSite: "strict",
      })

      // Definir um cookie com o timestamp do login para verificação de sessão
      cookies().set("auth_timestamp", Date.now().toString(), {
        path: "/",
        maxAge: 60 * 60 * 24, // 24 horas
        httpOnly: true,
        sameSite: "strict",
      })
    } catch (cookieError) {
      console.error("[Auth Server Action] Erro ao definir cookies:", cookieError)
      // Continuar mesmo se houver erro ao definir os cookies
    }

    // Revalidar caminhos para garantir que os dados estejam atualizados
    revalidatePath("/dashboard")
    revalidatePath("/")

    try {
      // Tentar redirecionamento do lado do servidor
      console.log("[Auth Server Action] Redirecionando para:", redirectTo)
      redirect(redirectTo)
    } catch (redirectError) {
      // Se ocorrer um erro durante o redirecionamento, tratá-lo como um caso especial
      console.error("[Auth Server Action] Erro ao redirecionar após login:", redirectError)
      const errorResult = handleAuthError(redirectError)

      // Registrar o erro de redirecionamento (como informação, não como erro crítico)
      logAuthError(redirectError, {
        email,
        action: "serverLogin_redirect",
      })

      // Se for um erro de redirecionamento, retornar sucesso com a URL para redirecionamento manual
      if (errorResult.type === AuthErrorType.REDIRECT_ERROR) {
        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email || "",
          },
          redirectTo: errorResult.redirectUrl || redirectTo,
        }
      }

      // Para outros tipos de erro, retornar o erro normalmente
      return {
        success: false,
        error: {
          type: errorResult.type,
          message: errorResult.message,
          suggestedAction: errorResult.suggestedAction,
          redirectUrl: redirectTo, // Incluir a URL de redirecionamento pretendida
        },
      }
    }

    // Este código nunca será executado devido ao redirect(), mas é necessário para o TypeScript
    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || "",
      },
    }
  } catch (error) {
    // Processar erros não relacionados ao Supabase
    console.error("[Auth Server Action] Erro não tratado:", error)
    const errorResult = handleAuthError(error)

    // Registrar o erro para análise
    logAuthError(error, {
      email,
      action: "serverLogin",
      attemptCount: loginAttempts.get(email)?.count,
    })

    // Se for um erro de redirecionamento, tratar de forma especial
    if (errorResult.type === AuthErrorType.REDIRECT_ERROR) {
      return {
        success: true, // Consideramos sucesso porque a autenticação funcionou
        redirectTo: errorResult.redirectUrl || redirectTo,
        error: {
          type: errorResult.type,
          message: "Login bem-sucedido, mas ocorreu um erro no redirecionamento",
          suggestedAction: "Clique no botão para continuar manualmente",
          redirectUrl: errorResult.redirectUrl || redirectTo,
        },
      }
    }

    return {
      success: false,
      error: {
        type: errorResult.type,
        message: errorResult.message,
        suggestedAction: errorResult.suggestedAction,
      },
    }
  }
}

/**
 * Server Action para verificar o status da autenticação e redirecionar se necessário
 */
export async function checkAuthAndRedirect(destination = "/dashboard") {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      const errorResult = handleAuthError(error)
      logAuthError(error, { action: "checkAuthAndRedirect" })

      return {
        success: false,
        error: {
          type: errorResult.type,
          message: errorResult.message,
        },
      }
    }

    if (data.session) {
      // Definir um cookie especial para sinalizar ao cliente que deve atualizar sua sessão
      try {
        cookies().set("auth_redirect", "true", {
          path: "/",
          maxAge: 60,
          httpOnly: false,
          sameSite: "strict",
        })
      } catch (cookieError) {
        console.error("[Auth Server Action] Erro ao definir cookie:", cookieError)
        // Continuar mesmo se houver erro ao definir o cookie
      }

      redirect(destination)
    }

    return {
      success: true,
      authenticated: false,
    }
  } catch (error) {
    const errorResult = handleAuthError(error)
    logAuthError(error, { action: "checkAuthAndRedirect" })

    return {
      success: false,
      error: {
        type: errorResult.type,
        message: errorResult.message,
      },
    }
  }
}

/**
 * Server Action para realizar logout
 */
export async function serverLogout() {
  try {
    const supabase = createServerClient()
    console.log("[Auth Server Action] Iniciando processo de logout")

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("[Auth Server Action] Erro ao fazer logout:", error)
      const errorResult = handleAuthError(error)
      logAuthError(error, { action: "serverLogout" })

      return {
        success: false,
        error: {
          type: errorResult.type,
          message: errorResult.message,
        },
      }
    }

    // Limpar cookies relacionados à autenticação
    try {
      const cookieStore = cookies()
      cookieStore.getAll().forEach((cookie) => {
        if (
          cookie.name.includes("supabase") ||
          cookie.name.includes("sb-") ||
          cookie.name === "auth_redirect" ||
          cookie.name === "auth_timestamp"
        ) {
          cookieStore.delete(cookie.name)
        }
      })
    } catch (cookieError) {
      console.error("[Auth Server Action] Erro ao limpar cookies:", cookieError)
      // Continuar mesmo se houver erro ao limpar os cookies
    }

    console.log("[Auth Server Action] Logout bem-sucedido, redirecionando para login")

    // Revalidar caminhos
    revalidatePath("/")
    revalidatePath("/login")

    // Redirecionamento do lado do servidor
    redirect("/login")
  } catch (error) {
    console.error("[Auth Server Action] Erro não tratado durante logout:", error)
    const errorResult = handleAuthError(error)
    logAuthError(error, { action: "serverLogout" })

    return {
      success: false,
      error: {
        type: errorResult.type,
        message: errorResult.message,
      },
    }
  }
}
