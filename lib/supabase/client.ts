import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// Variável global para armazenar a instância do cliente
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClientClient() {
  // Se estamos no servidor, sempre criar uma nova instância
  if (typeof window === "undefined") {
    try {
      return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
    } catch (error) {
      console.error("[Supabase Client] Erro ao criar cliente no servidor:", error)
      throw error
    }
  }

  // No cliente, reutilizar a instância existente
  if (!clientInstance) {
    try {
      console.log("[Supabase Client] Criando nova instância do cliente")
      clientInstance = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
    } catch (error) {
      console.error("[Supabase Client] Erro ao criar cliente no navegador:", error)
      throw error
    }
  } else {
    console.log("[Supabase Client] Reutilizando instância existente do cliente")
  }

  return clientInstance
}

// Função para limpar a instância (útil para testes e logout completo)
export function clearClientInstance() {
  clientInstance = null
  console.log("[Supabase Client] Instância do cliente limpa")
}
