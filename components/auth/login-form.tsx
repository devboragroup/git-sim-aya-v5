"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { RedirectDebugger } from "./redirect-debugger"
import { redirectToDashboard } from "@/app/login/actions"

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginStatus, setLoginStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showDebugger, setShowDebugger] = useState(false)
  const { signIn } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    setLoginStatus("loading")
    setErrorMessage(null)

    try {
      console.log("Login bem-sucedido, redirecionando...")
      setLoginStatus("success")

      toast({
        title: "Login bem-sucedido",
        description: "Você será redirecionado para o dashboard",
        variant: "default",
      })

      // Tentativa 1: Redirecionamento com Server Action
      try {
        console.log("Tentativa 1: Redirecionamento com Server Action")
        await redirectToDashboard()
      } catch (e) {
        console.error("Erro na Tentativa 1:", e)
      }

      // Tentativa 2: Redirecionamento com router.push após timeout
      setTimeout(() => {
        try {
          console.log("Tentativa 2: Redirecionamento com router.push após timeout")
          router.push("/dashboard")
        } catch (e) {
          console.error("Erro na Tentativa 2:", e)
        }
      }, 1000)

      // Tentativa 3: Redirecionamento direto com router.push
      try {
        console.log("Tentativa 3: Redirecionamento direto com router.push")
        router.push("/dashboard")
      } catch (e) {
        console.error("Erro na Tentativa 3:", e)
      }
    } catch (error: any) {
      console.error("Erro no login:", error)
      setLoginStatus("error")

      // Extrair mensagem de erro mais detalhada
      const errorMsg = error.message || "Verifique suas credenciais e tente novamente"
      setErrorMessage(errorMsg)

      toast({
        title: "Erro ao fazer login",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para tentar redirecionamento manual
  const handleManualRedirect = () => {
    try {
      console.log("Tentativa de redirecionamento manual")
      window.location.href = "/dashboard"
    } catch (e) {
      console.error("Erro no redirecionamento manual:", e)
      setErrorMessage(`Erro no redirecionamento: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div className="grid gap-6">
      {loginStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro no login</AlertTitle>
          <AlertDescription>
            {errorMessage || "Ocorreu um erro ao tentar fazer login. Por favor, tente novamente."}
          </AlertDescription>
        </Alert>
      )}

      {loginStatus === "success" && (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Login bem-sucedido</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Você será redirecionado para o dashboard em instantes.</p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                onClick={handleManualRedirect}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Clique aqui se não for redirecionado automaticamente
              </Button>
              <Button variant="link" className="text-green-700" onClick={() => setShowDebugger(!showDebugger)}>
                {showDebugger ? "Ocultar ferramentas de diagnóstico" : "Mostrar ferramentas de diagnóstico"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {showDebugger && loginStatus === "success" && <RedirectDebugger />}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <Input
              id="email"
              placeholder="nome@exemplo.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              className="bg-gray-800 border-gray-700 text-white"
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-white">
                Senha
              </Label>
              <Button variant="link" className="h-auto p-0 text-sm text-aya-green" asChild>
                <a href="/esqueci-senha">Esqueceu a senha?</a>
              </Button>
            </div>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              disabled={isLoading}
              className="bg-gray-800 border-gray-700 text-white"
              {...register("password")}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
          <Button type="submit" disabled={isLoading} className="bg-aya-green hover:bg-opacity-90 text-white">
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </div>
      </form>

      <div className="text-center text-sm text-gray-400">
        <p>Status do sistema: {process.env.NODE_ENV === "production" ? "Produção" : "Desenvolvimento"}</p>
      </div>
    </div>
  )
}
