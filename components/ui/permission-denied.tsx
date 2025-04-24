import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

interface PermissionDeniedProps {
  message?: string
  backUrl?: string
}

export function PermissionDenied({
  message = "Você não tem permissão para acessar esta página.",
  backUrl = "/dashboard",
}: PermissionDeniedProps) {
  return (
    <Card className="mx-auto max-w-md bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          <CardTitle className="text-white">Acesso Negado</CardTitle>
        </div>
        <CardDescription className="text-gray-400">Você não possui as permissões necessárias</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-white">{message}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-aya-green hover:bg-opacity-90" asChild>
          <Link href={backUrl}>Voltar</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
