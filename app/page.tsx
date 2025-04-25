import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

// Forçar renderização dinâmica para evitar erros com cookies durante o build
export const dynamic = "force-dynamic"

export default async function Home() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  } else {
    redirect("/dashboard")
  }

  return null
}
