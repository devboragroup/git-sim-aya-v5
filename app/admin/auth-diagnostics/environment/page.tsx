import { checkAuthEnvironment, checkSiteUrl, isDevelopment } from "@/lib/auth/debug-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle } from "lucide-react"

export default function AuthEnvironmentPage() {
  // Verificar variáveis de ambiente
  const envCheck = checkAuthEnvironment()
  const siteUrlCheck = checkSiteUrl()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico de Ambiente de Autenticação</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status do Ambiente</CardTitle>
            <CardDescription>Verificação das variáveis de ambiente necessárias para autenticação</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant={envCheck.valid ? "default" : "destructive"} className="mb-4">
              {envCheck.valid ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertTitle>
                {envCheck.valid ? "Ambiente configurado corretamente" : "Problemas na configuração do ambiente"}
              </AlertTitle>
              <AlertDescription>
                {envCheck.valid ? (
                  "Todas as variáveis de ambiente necessárias estão configuradas."
                ) : (
                  <ul className="list-disc pl-5 mt-2">
                    {envCheck.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Detalhes da URL do Site</h3>
              <div className="bg-gray-100 p-4 rounded-md">
                <p>
                  <strong>URL:</strong> {siteUrlCheck.url || "Não definido"}
                </p>
                <p>
                  <strong>Válido:</strong> {siteUrlCheck.valid ? "Sim" : "Não"}
                </p>
                {siteUrlCheck.issues.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Problemas:</p>
                    <ul className="list-disc pl-5">
                      {siteUrlCheck.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Ambiente</h3>
              <div className="bg-gray-100 p-4 rounded-md">
                <p>
                  <strong>Modo:</strong> {isDevelopment() ? "Desenvolvimento" : "Produção"}
                </p>
                <p>
                  <strong>Node.js:</strong> {process.version}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
