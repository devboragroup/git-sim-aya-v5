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
import { excluirEmpreendimento } from "@/actions/empreendimentos"
import { Icons } from "@/components/icons"
import { Trash2 } from "lucide-react"

interface ExcluirEmpreendimentoDialogProps {
  empreendimentoId: string
  empreendimentoNome: string
}

export function ExcluirEmpreendimentoDialog({
  empreendimentoId,
  empreendimentoNome,
}: ExcluirEmpreendimentoDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleDelete() {
    setIsLoading(true)

    try {
      const result = await excluirEmpreendimento(empreendimentoId)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Empreendimento excluído",
        description: "O empreendimento foi excluído com sucesso.",
      })

      setIsOpen(false)
      router.push("/empreendimentos")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir empreendimento",
        description: error.message || "Ocorreu um erro ao excluir o empreendimento.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setIsOpen(true)} className="bg-red-600 hover:bg-red-700">
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir Empreendimento
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir Empreendimento</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tem certeza que deseja excluir o empreendimento{" "}
              <span className="font-semibold text-white">{empreendimentoNome}</span>?
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
