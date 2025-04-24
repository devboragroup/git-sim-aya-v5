import { createServerClient } from "@/lib/supabase/server"

export async function checkPermission(userId: string, module: string, action: string, resourceId?: string) {
  const supabase = createServerClient()

  try {
    // Verificar se o usuário é admin (simplificado)
    const { data: userData, error: userError } = await supabase
      .from("auth.users")
      .select("raw_user_meta_data")
      .eq("id", userId)
      .single()

    if (!userError && userData?.raw_user_meta_data?.is_admin === true) {
      return true
    }

    // Tentar usar a função RPC, mas não falhar se ela não existir
    try {
      const { data, error } = await supabase.rpc("usuario_tem_permissao", {
        p_usuario_id: userId,
        p_modulo: module,
        p_acao: action,
        p_recurso_id: resourceId || null,
      })

      if (error) {
        console.error("Erro ao verificar permissão:", error)
        // Se a função não existir, permitir acesso temporariamente
        if (error.message.includes("function") && error.message.includes("does not exist")) {
          console.warn("Função de permissão não encontrada, permitindo acesso temporariamente")
          return true
        }
        return false
      }

      return !!data
    } catch (rpcError) {
      console.error("Erro ao chamar RPC de permissão:", rpcError)
      // Permitir acesso temporariamente se houver erro na função
      return true
    }
  } catch (error) {
    console.error("Erro ao verificar permissão:", error)
    return false
  }
}
