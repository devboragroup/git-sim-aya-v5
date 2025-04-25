"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { createClientClient, clearClientInstance } from "@/lib/supabase/client"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  error: Error | null
  authStatus: string
  lastAuthAction: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [authStatus, setAuthStatus] = useState<string>("initializing")
  const [lastAuthAction, setLastAuthAction] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientClient()

  // Função para atualizar a sessão
  const refreshSession = useCallback(async () => {
    try {
      console.log("[AuthContext] Atualizando sessão...")
      setAuthStatus("refreshing_session")

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("[AuthContext] Erro ao atualizar sessão:", sessionError)
        setError(sessionError)
        setAuthStatus("session_refresh_error")
        return
      }

      if (session) {
        console.log("[AuthContext] Sessão atualizada:", session.user.email)
        setAuthStatus("session_refreshed")
        setLastAuthAction(`Sessão atualizada para ${session.user.email}`)
        setSession(session)
        setUser(session.user)
      } else {
        console.log("[AuthContext] Nenhuma sessão encontrada após atualização")
        setAuthStatus("no_session_after_refresh")
        setSession(null)
        setUser(null)
      }
    } catch (err) {
      console.error("[AuthContext] Erro ao atualizar sessão:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      setAuthStatus("session_refresh_error")
    }
  }, [supabase])

  // Verificar se há um cookie de redirecionamento de autenticação
  useEffect(() => {
    const checkAuthRedirectCookie = () => {
      if (typeof document !== "undefined") {
        const cookies = document.cookie.split(";").map((c) => c.trim())
        const hasAuthRedirect = cookies.some((c) => c.startsWith("auth_redirect=true"))

        if (hasAuthRedirect) {
          console.log("[AuthContext] Detectado cookie de redirecionamento de autenticação")
          // Remover o cookie
          document.cookie = "auth_redirect=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
          // Atualizar a sessão
          refreshSession()
        }
      }
    }

    // Verificar imediatamente
    checkAuthRedirectCookie()

    // Verificar periodicamente (a cada 2 segundos)
    const interval = setInterval(checkAuthRedirectCookie, 2000)

    return () => clearInterval(interval)
  }, [refreshSession])

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log("[AuthContext] Verificando sessão existente...")
        setAuthStatus("checking_session")

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("[AuthContext] Erro ao obter sessão:", sessionError)
          setError(sessionError)
          setAuthStatus("session_error")
        }

        if (session) {
          console.log("[AuthContext] Sessão encontrada:", session.user.email)
          setAuthStatus("session_found")
          setLastAuthAction(`Sessão encontrada para ${session.user.email}`)
        } else {
          console.log("[AuthContext] Nenhuma sessão ativa encontrada")
          setAuthStatus("no_session")
        }

        setSession(session)
        setUser(session?.user ?? null)
      } catch (err) {
        console.error("[AuthContext] Erro ao verificar sessão:", err)
        setError(err instanceof Error ? err : new Error(String(err)))
        setAuthStatus("session_check_error")
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AuthContext] Mudança de estado de autenticação:", event)
      setLastAuthAction(`Evento de autenticação: ${event}`)

      if (event === "SIGNED_IN") {
        setAuthStatus("signed_in")
        console.log("[AuthContext] Usuário autenticado:", session?.user.email)
      } else if (event === "SIGNED_OUT") {
        setAuthStatus("signed_out")
        console.log("[AuthContext] Usuário desconectado")

        // Limpar a instância do cliente Supabase ao fazer logout
        clearClientInstance()
      } else if (event === "TOKEN_REFRESHED") {
        setAuthStatus("token_refreshed")
        console.log("[AuthContext] Token atualizado")
      } else if (event === "USER_UPDATED") {
        setAuthStatus("user_updated")
        console.log("[AuthContext] Dados do usuário atualizados")
      }

      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    setError(null)
    setAuthStatus("signing_in")
    setLastAuthAction(`Tentativa de login: ${email}`)

    try {
      console.log(`[AuthContext] Tentando login com email: ${email}`)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("[AuthContext] Erro de autenticação:", error)
        setError(error)
        setAuthStatus("sign_in_error")
        setLastAuthAction(`Erro no login: ${error.message}`)
        throw error
      }

      if (data.user) {
        console.log("[AuthContext] Login bem-sucedido para:", data.user.email)
        setUser(data.user)
        setSession(data.session)
        setAuthStatus("signed_in_success")
        setLastAuthAction(`Login bem-sucedido: ${data.user.email}`)

        // Tentativa de redirecionamento
        try {
          console.log("[AuthContext] Tentando redirecionamento após login")
          router.refresh()
          router.push("/dashboard")
        } catch (redirectError) {
          console.error("[AuthContext] Erro ao redirecionar após login:", redirectError)
          setLastAuthAction(
            `Erro no redirecionamento: ${redirectError instanceof Error ? redirectError.message : String(redirectError)}`,
          )
        }
      }
    } catch (err) {
      console.error("[AuthContext] Erro durante o login:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      setAuthStatus("sign_in_exception")
      throw err
    }
  }

  const signOut = async () => {
    try {
      console.log("[AuthContext] Iniciando logout...")
      setAuthStatus("signing_out")
      setLastAuthAction("Iniciando processo de logout")

      await supabase.auth.signOut()

      console.log("[AuthContext] Logout concluído")
      setUser(null)
      setSession(null)
      setAuthStatus("signed_out_success")
      setLastAuthAction("Logout concluído com sucesso")

      // Limpar a instância do cliente Supabase
      clearClientInstance()

      router.refresh()
      router.push("/login")
    } catch (err) {
      console.error("[AuthContext] Erro durante o logout:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      setAuthStatus("sign_out_error")
      setLastAuthAction(`Erro no logout: ${err instanceof Error ? err.message : String(err)}`)
      throw err
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signOut,
    refreshSession,
    error,
    authStatus,
    lastAuthAction,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
