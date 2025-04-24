import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// Singleton pattern para evitar múltiplas instâncias
let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClientClient() {
  if (client) return client

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  return client
}
