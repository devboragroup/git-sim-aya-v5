"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { excluirUnidade } from "@/actions/unidades"
import { Icons } from "@/components/icons"
import { Trash2 from "lucide-react"

interface ExcluirUnidadeDialogProps {
  unidadeId: string
  unidadeIdentificador: string
  empreendimentoId: string
}

export function ExcluirUnidadeDialog({ unidadeId, unidadeIdentificador, empreendimentoId }: ExcluirUnidadeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleDelete() {
    setIsLoading(true)

    try {
      const result = await excluirUnidade(unidadeId)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Unidade excluída",
        description: "A unidade foi excluída com sucesso.",
      })

      setIsOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir unidade",
        description: error.message || "Ocorreu um erro ao excluir a unidade.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-gray-800"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Excluir</span>
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir Unidade</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tem certeza que deseja excluir a unidade{" "}
              <span className="font-semibold text-white">{unidadeIdentificador}</span>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800" disabled={isLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Sim, excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
