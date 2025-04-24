"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { clonarParametroPrecificacao } from "@/actions/parametros"
import { Icons } from "@/components/icons"
import { Copy } from "lucide-react"

interface ClonarParametroDialogProps {
  parametroId: string
  parametroNome: string
}

export function ClonarParametroDialog({ parametroId, parametroNome }: ClonarParametroDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [novoNome, setNovoNome] = useState(`Cópia de ${parametroNome}`)
  const router = useRouter()
  const { toast } = useToast()

  async function handleClonar() {
    if (!novoNome.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, informe um nome válido para o novo parâmetro.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await clonarParametroPrecificacao(parametroId, novoNome)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Parâmetro clonado",
        description: "O parâmetro foi clonado com sucesso.",
      })

      setIsOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro ao clonar parâmetro",
        description: error.message || "Ocorreu um erro ao clonar o parâmetro.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
          <Copy className="mr-2 h-4 w-4" />
          Clonar
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Clonar Parâmetro</DialogTitle>
          <DialogDescription className="text-gray-400">
            Crie uma cópia do parâmetro "{parametroNome}" com um novo nome.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="novoNome" className="text-white">
              Nome do novo parâmetro
            </Label>
            <Input
              id="novoNome"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button className="bg-aya-green hover:bg-opacity-90" onClick={handleClonar} disabled={isLoading}>
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Clonando...
              </>
            ) : (
              "Clonar Parâmetro"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
