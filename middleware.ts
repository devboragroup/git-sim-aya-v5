import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Se não estiver autenticado e tentar acessar uma rota protegida
  if (!session && !request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Permitir acesso a todas as rotas para usuários autenticados
  // A verificação de permissões específicas será feita nas páginas/actions
  return res
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register|esqueci-senha).*)"],
}
