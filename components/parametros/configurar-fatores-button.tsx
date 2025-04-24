"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { configurarFatoresPavimento } from "@/actions/parametros"
import { Loader2, Sliders } from "lucide-react"

interface ConfigurarFatoresButtonProps {
  parametroId: string
}

export function ConfigurarFatoresButton({ parametroId }: ConfigurarFatoresButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleConfigurarFatores() {
    setIsLoading(true)

    try {
      const result = await configurarFatoresPavimento(parametroId)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Fatores configurados",
        description: "Os fatores de pavimento foram configurados com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao configurar fatores",
        description: error.message || "Ocorreu um erro ao configurar os fatores de pavimento.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button className="bg-aya-green hover:bg-opacity-90" onClick={handleConfigurarFatores} disabled={isLoading}>
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sliders className="mr-2 h-4 w-4" />}
      Configurar Fatores
    </Button>
  )
}
