"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export function AuthRedirectDetector() {
  const { refreshSession, session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Verificar se há um cookie de redirecionamento de autenticação
    const checkAuthRedirect = () => {
      const cookies = document.cookie.split(";").map((c) => c.trim())
      const hasAuthRedirect = cookies.some((c) => c.startsWith("auth_redirect=true"))
      const authTimestamp = cookies.find((c) => c.startsWith("auth_timestamp="))

      if (hasAuthRedirect) {
        console.log("[AuthRedirectDetector] Detectado redirecionamento de autenticação, atualizando sessão...")
        refreshSession()

        // Limpar o cookie
        document.cookie = "auth_redirect=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      }

      // Verificar se há um timestamp de autenticação recente (menos de 5 minutos)
      if (authTimestamp) {
        const timestamp = Number.parseInt(authTimestamp.split("=")[1])
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000

        if (now - timestamp < fiveMinutes) {
          console.log("[AuthRedirectDetector] Autenticação recente detectada, atualizando sessão...")
          refreshSession()
        }
      }
    }

    checkAuthRedirect()

    // Também verificar quando a janela recebe foco
    const handleFocus = () => {
      console.log("[AuthRedirectDetector] Janela recebeu foco, verificando sessão...")
      refreshSession()
    }

    window.addEventListener("focus", handleFocus)

    // Verificar periodicamente
    const interval = setInterval(checkAuthRedirect, 5000)

    return () => {
      window.removeEventListener("focus", handleFocus)
      clearInterval(interval)
    }
  }, [refreshSession])

  // Verificar se estamos em uma rota protegida sem sessão
  useEffect(() => {
    const isProtectedRoute =
      typeof window !== "undefined" &&
      ["/dashboard", "/empreendimentos", "/admin"].some((route) => window.location.pathname.startsWith(route))

    if (isProtectedRoute && session === null && !document.cookie.includes("auth_redirect=true")) {
      console.log("[AuthRedirectDetector] Rota protegida sem sessão, redirecionando para login...")
      router.push("/login?redirectTo=" + encodeURIComponent(window.location.pathname))
    }
  }, [session, router])

  return null // Este componente não renderiza nada
}
