import type { Metadata } from "next"
import { LoginAttemptsMonitor } from "@/components/auth/login-attempts-monitor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Diagnóstico de Autenticação - Simulador AYA",
  description: "Ferramentas de diagnóstico para problemas de autenticação",
}

export default async function AuthDiagnosticsPage() {
  // Verificar se o usuário está autenticado e tem permissões de administrador
  const supabase = createServerClient()
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session) {
    redirect("/login")
  }

  // Verificar se o usuário é administrador
  const { data: userData } = await supabase.from("profiles").select("role").eq("id", data.session.user.id).single()

  if (!userData || userData.role !== "admin") {
    // Redirecionar para página de acesso negado
    redirect("/acesso-negado")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico de Autenticação</h1>

      <Tabs defaultValue="attempts">
        <TabsList className="mb-4">
          <TabsTrigger value="attempts">Tentativas de Login</TabsTrigger>
          <TabsTrigger value="sessions">Sessões Ativas</TabsTrigger>
          <TabsTrigger value="system">Status do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="attempts">
          <Card>
            <CardHeader>
              <CardTitle>Monitoramento de Tentativas de Login</CardTitle>
              <CardDescription>Visualize e analise tentativas recentes de login no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginAttemptsMonitor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Sessões Ativas</CardTitle>
              <CardDescription>Visualize e gerencie sessões ativas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Funcionalidade em desenvolvimento. Em breve você poderá visualizar e gerenciar sessões ativas.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema de Autenticação</CardTitle>
              <CardDescription>Informações sobre o estado atual do sistema de autenticação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Ambiente</h3>
                    <p>{process.env.NODE_ENV === "production" ? "Produção" : "Desenvolvimento"}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Provedor de Autenticação</h3>
                    <p>Supabase Auth</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Status da API</h3>
                    <p className="text-green-600">Operacional</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Última Verificação</h3>
                    <p>{new Date().toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
