import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  try {
    // Criar cliente do Supabase
    const { supabase, response } = createServerClient(request)

    // Verificar se o usuário está autenticado
    let session = null
    let sessionError = null

    try {
      const sessionResult = await supabase.auth.getSession()
      session = sessionResult.data.session
      sessionError = sessionResult.error
    } catch (error) {
      console.error(`[Middleware] Erro ao obter sessão: ${error instanceof Error ? error.message : String(error)}`)
      // Continuar sem sessão
    }

    // Registrar informações de depuração
    console.log(`[Middleware] URL: ${request.nextUrl.pathname}`)
    console.log(`[Middleware] Autenticado: ${!!session}`)

    if (sessionError) {
      console.error(`[Middleware] Erro ao verificar sessão: ${sessionError.message}`)
    }

    // Rotas protegidas que exigem autenticação
    const protectedRoutes = ["/dashboard", "/empreendimentos", "/admin"]
    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    // Rotas de autenticação (login, registro, etc.)
    const authRoutes = ["/login", "/registro", "/esqueci-senha"]
    const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    // Se for uma rota protegida e o usuário não estiver autenticado, redirecionar para login
    if (isProtectedRoute && !session) {
      console.log(`[Middleware] Redirecionando para login: ${request.nextUrl.pathname}`)

      // Registrar tentativa de acesso não autorizado
      const url = new URL("/login", request.url)

      // Importante: Garantir que o redirectTo seja passado corretamente
      url.searchParams.set("redirectTo", request.nextUrl.pathname)

      return NextResponse.redirect(url)
    }

    // Se for uma rota de autenticação e o usuário já estiver autenticado, redirecionar para dashboard
    if (isAuthRoute && session) {
      console.log(`[Middleware] Usuário já autenticado, redirecionando para dashboard`)

      // Verificar se há um redirectTo na URL
      const redirectTo = request.nextUrl.searchParams.get("redirectTo")
      const destination = redirectTo || "/dashboard"

      return NextResponse.redirect(new URL(destination, request.url))
    }

    // Para todas as outras rotas, continuar normalmente
    return response
  } catch (error) {
    console.error(`[Middleware] Erro não tratado: ${error instanceof Error ? error.message : String(error)}`)

    // Em caso de erro, permitir que a requisição continue
    // Isso evita que o usuário fique preso em um loop de redirecionamento
    return NextResponse.next()
  }
}

// Configurar quais caminhos o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos, exceto:
     * 1. Arquivos estáticos (/_next/, /static/, /favicon.ico, etc.)
     * 2. Rotas da API que não precisam de autenticação
     */
    "/((?!_next/static|_next/image|favicon.ico|api/public).*)",
  ],
}
