import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar se há uma sessão ativa
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Erro ao verificar sessão",
          error: sessionError.message,
          location: "API route handler",
        },
        { status: 500 },
      )
    }

    // Verificar se o usuário está autenticado
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Erro ao obter usuário",
          error: userError.message,
          location: "API route handler",
        },
        { status: 500 },
      )
    }

    // Retornar informações sobre a sessão e o usuário
    return NextResponse.json({
      status: "success",
      authenticated: !!userData.user,
      session: sessionData.session
        ? {
            expires_at: sessionData.session.expires_at,
            created_at: sessionData.session.created_at,
          }
        : null,
      user: userData.user
        ? {
            id: userData.user.id,
            email: userData.user.email,
            last_sign_in_at: userData.user.last_sign_in_at,
          }
        : null,
      cookies: {
        count: cookies().getAll().length,
        names: cookies()
          .getAll()
          .map((c) => c.name),
      },
      location: "API route handler",
    })
  } catch (error) {
    console.error("Erro na rota de verificação do middleware:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : String(error),
        location: "API route handler",
      },
      { status: 500 },
    )
  }
}
