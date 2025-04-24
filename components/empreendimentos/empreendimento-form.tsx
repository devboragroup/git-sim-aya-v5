"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { criarEmpreendimento } from "@/actions/empreendimentos"
import { Icons } from "@/components/icons"

const empreendimentoSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  tipo: z.string().min(1, { message: "Tipo é obrigatório" }),
  endereco: z.string().min(5, { message: "Endereço deve ter pelo menos 5 caracteres" }),
  registro: z.string().optional(),
  descricao: z.string().optional(),
  vgv_bruto_alvo: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: "Deve ser um número válido" })
    .transform((val) => Number(val)),
  percentual_permuta: z
    .string()
    .refine((val) => !isNaN(Number(val)), { message: "Deve ser um número válido" })
    .refine((val) => Number(val) >= 0 && Number(val) <= 100, { message: "Deve estar entre 0 e 100" })
    .transform((val) => Number(val)),
})

type EmpreendimentoFormValues = z.infer<typeof empreendimentoSchema>

export function EmpreendimentoForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<EmpreendimentoFormValues>({
    resolver: zodResolver(empreendimentoSchema),
    defaultValues: {
      nome: "",
      tipo: "",
      endereco: "",
      registro: "",
      descricao: "",
      vgv_bruto_alvo: "",
      percentual_permuta: "0",
    },
  })

  async function onSubmit(data: EmpreendimentoFormValues) {
    setIsLoading(true)

    try {
      const result = await criarEmpreendimento(data)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Empreendimento criado",
        description: "O empreendimento foi cadastrado com sucesso.",
      })

      router.push(`/empreendimentos/${result.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro ao criar empreendimento",
        description: error.message || "Ocorreu um erro ao cadastrar o empreendimento.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-white">
                Nome do Empreendimento
              </Label>
              <Input
                id="nome"
                placeholder="Nome do empreendimento"
                className="bg-gray-800 border-gray-700 text-white"
                disabled={isLoading}
                {...form.register("nome")}
              />
              {form.formState.errors.nome && (
                <p className="text-sm text-red-500">{form.formState.errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-white">
                Tipo
              </Label>
              <Select
                disabled={isLoading}
                onValueChange={(value) => form.setValue("tipo", value)}
                defaultValue={form.getValues("tipo")}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="residencial">Residencial</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="misto">Misto</SelectItem>
                  <SelectItem value="loteamento">Loteamento</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.tipo && (
                <p className="text-sm text-red-500">{form.formState.errors.tipo.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco" className="text-white">
              Endereço
            </Label>
            <Textarea
              id="endereco"
              placeholder="Endereço completo"
              className="bg-gray-800 border-gray-700 text-white"
              disabled={isLoading}
              {...form.register("endereco")}
            />
            {form.formState.errors.endereco && (
              <p className="text-sm text-red-500">{form.formState.errors.endereco.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="registro" className="text-white">
                Registro
              </Label>
              <Input
                id="registro"
                placeholder="Número do registro"
                className="bg-gray-800 border-gray-700 text-white"
                disabled={isLoading}
                {...form.register("registro")}
              />
              {form.formState.errors.registro && (
                <p className="text-sm text-red-500">{form.formState.errors.registro.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vgv_bruto_alvo" className="text-white">
                VGV Bruto Alvo (R$)
              </Label>
              <Input
                id="vgv_bruto_alvo"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="bg-gray-800 border-gray-700 text-white"
                disabled={isLoading}
                {...form.register("vgv_bruto_alvo")}
              />
              {form.formState.errors.vgv_bruto_alvo && (
                <p className="text-sm text-red-500">{form.formState.errors.vgv_bruto_alvo.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="percentual_permuta" className="text-white">
              Percentual de Permuta (%)
            </Label>
            <Input
              id="percentual_permuta"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0.00"
              className="bg-gray-800 border-gray-700 text-white"
              disabled={isLoading}
              {...form.register("percentual_permuta")}
            />
            {form.formState.errors.percentual_permuta && (
              <p className="text-sm text-red-500">{form.formState.errors.percentual_permuta.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-white">
              Descrição
            </Label>
            <Textarea
              id="descricao"
              placeholder="Descrição do empreendimento"
              className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
              disabled={isLoading}
              {...form.register("descricao")}
            />
            {form.formState.errors.descricao && (
              <p className="text-sm text-red-500">{form.formState.errors.descricao.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t border-gray-800 bg-gray-900 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            disabled={isLoading}
            onClick={() => router.back()}
          >
            Cancelar
          </Button>

          <Button type="submit" className="bg-aya-green hover:bg-opacity-90" disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Empreendimento
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
