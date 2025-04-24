// Script para verificar variáveis de ambiente necessárias
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_USER",
  "POSTGRES_HOST",
  "POSTGRES_PASSWORD",
  "POSTGRES_DATABASE",
  "SUPABASE_JWT_SECRET",
]

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error("❌ As seguintes variáveis de ambiente estão faltando:")
  missingEnvVars.forEach((envVar) => console.error(`   - ${envVar}`))
  console.error("\nPor favor, configure estas variáveis no painel da Vercel antes de fazer o deploy.")

  // Em ambiente de desenvolvimento, não queremos interromper o processo
  if (process.env.NODE_ENV === "production") {
    process.exit(1)
  }
} else {
  console.log("✅ Todas as variáveis de ambiente necessárias estão configuradas.")
}
