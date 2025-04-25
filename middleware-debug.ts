import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Este middleware é apenas para depuração e deve ser removido em produção
export function middleware(request: NextRequest) {
  // Registra informações sobre a requisição
  console.log(`[Middleware Debug] Rota: ${request.nextUrl.pathname}`)
  console.log(`[Middleware Debug] Método: ${request.method}`)
  console.log(`[Middleware Debug] Cookies:`, request.cookies.getAll())

  // Verifica se há um token de autenticação
  const hasAuthCookie = request.cookies.has("sb-auth-token") || request.cookies.has("supabase-auth-token")

  console.log(`[Middleware Debug] Token de autenticação presente: ${hasAuthCookie}`)

  // Continua com a requisição normalmente
  return NextResponse.next()
}

// Configurar para executar apenas em rotas específicas em desenvolvimento
export const config = {
  matcher: process.env.NODE_ENV === "development" ? ["/api/:path*", "/login", "/dashboard"] : [],
}
