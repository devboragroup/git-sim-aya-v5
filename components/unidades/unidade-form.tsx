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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { criarUnidade, atualizarUnidade } from "@/actions/unidades"
import { Icons } from "@/components/icons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const unidadeSchema = z.object({
  id: z.string().optional(),
  identificador: z.string().min(1, { message: "Identificador é obrigatório" }),
  tipo: z.string().min(1, { message: "Tipo é obrigatório" }),
  tipo_unidade: z.string().optional(),
  area_privativa: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Área privativa deve ser um número maior que zero",
  }),
  area_total: z.string().optional(),
  pavimento: z.string().optional(),
  dormitorios: z.string().optional(),
  suites: z.string().optional(),
  vagas: z.string().optional(),
  vagas_simples: z.string().optional(),
  vagas_duplas: z.string().optional(),
  vagas_moto: z.string().optional(),
  hobby_box: z.string().optional(),
  orientacao_solar: z.string().optional(),
  status: z.string().optional(),
})

type UnidadeFormValues = z.infer<typeof unidadeSchema>

interface UnidadeFormProps {
  empreendimentoId: string
  unidade?: any // Dados da unidade para edição
}

export function UnidadeForm({ empreendimentoId, unidade }: UnidadeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!unidade

  const form = useForm<UnidadeFormValues>({
    resolver: zodResolver(unidadeSchema),
    defaultValues: {
      id: unidade?.id || undefined,
      identificador: unidade?.identificador || "",
      tipo: unidade?.tipo || "",
      tipo_unidade: unidade?.tipo_unidade || "",
      area_privativa: unidade?.area_privativa?.toString() || "",
      area_total: unidade?.area_total?.toString() || "",
      pavimento: unidade?.pavimento?.toString() || "",
      dormitorios: unidade?.dormitorios?.toString() || "",
      suites: unidade?.suites?.toString() || "",
      vagas: unidade?.vagas?.toString() || "",
      vagas_simples: unidade?.vagas_simples?.toString() || "",
      vagas_duplas: unidade?.vagas_duplas?.toString() || "",
      vagas_moto: unidade?.vagas_moto?.toString() || "",
      hobby_box: unidade?.hobby_box?.toString() || "",
      orientacao_solar: unidade?.orientacao_solar || "",
      status: unidade?.status || "disponivel",
    },
  })

  async function onSubmit(data: UnidadeFormValues) {
    setIsLoading(true)

    try {
      // Converter valores para números quando necessário
      const unidadeData = {
        id: data.id,
        empreendimento_id: empreendimentoId,
        identificador: data.identificador,
        tipo: data.tipo,
        tipo_unidade: data.tipo_unidade || data.tipo,
        area_privativa: Number(data.area_privativa),
        area_total: data.area_total ? Number(data.area_total) : undefined,
        pavimento: data.pavimento ? Number(data.pavimento) : undefined,
        dormitorios: data.dormitorios ? Number(data.dormitorios) : undefined,
        suites: data.suites ? Number(data.suites) : undefined,
        vagas: data.vagas ? Number(data.vagas) : undefined,
        vagas_simples: data.vagas_simples ? Number(data.vagas_simples) : undefined,
        vagas_duplas: data.vagas_duplas ? Number(data.vagas_duplas) : undefined,
        vagas_moto: data.vagas_moto ? Number(data.vagas_moto) : undefined,
        hobby_box: data.hobby_box ? Number(data.hobby_box) : undefined,
        orientacao_solar: data.orientacao_solar || undefined,
        status: data.status || "disponivel",
      }

      if (isEditing) {
        // Atualizar unidade existente
        const result = await atualizarUnidade(unidadeData)

        if (result.error) {
          throw new Error(result.error)
        }

        toast({
          title: "Unidade atualizada",
          description: "A unidade foi atualizada com sucesso.",
        })

        router.push(`/empreendimentos/${empreendimentoId}/unidades`)
      } else {
        // Criar nova unidade
        const result = await criarUnidade(unidadeData)

        if (result.error) {
          throw new Error(result.error)
        }

        toast({
          title: "Unidade criada",
          description: "A unidade foi cadastrada com sucesso.",
        })

        router.push(`/empreendimentos/${empreendimentoId}/unidades`)
      }

      router.refresh()
    } catch (error: any) {
      toast({
        title: isEditing ? "Erro ao atualizar unidade" : "Erro ao criar unidade",
        description: error.message || `Ocorreu um erro ao ${isEditing ? "atualizar" : "cadastrar"} a unidade.`,
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
          <Tabs defaultValue="informacoes-basicas" className="w-full">
            <TabsList className="bg-gray-800 w-full">
              <TabsTrigger
                value="informacoes-basicas"
                className="flex-1 data-[state=active]:bg-aya-green data-[state=active]:text-white"
              >
                Informações Básicas
              </TabsTrigger>
              <TabsTrigger
                value="caracteristicas"
                className="flex-1 data-[state=active]:bg-aya-green data-[state=active]:text-white"
              >
                Características
              </TabsTrigger>
              <TabsTrigger
                value="status"
                className="flex-1 data-[state=active]:bg-aya-green data-[state=active]:text-white"
              >
                Status
              </TabsTrigger>
            </TabsList>

            {/* Informações Básicas */}
            <TabsContent value="informacoes-basicas" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="identificador" className="text-white">
                    Identificador <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="identificador"
                    placeholder="Ex: Apto 101"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("identificador")}
                  />
                  {form.formState.errors.identificador && (
                    <p className="text-sm text-red-500">{form.formState.errors.identificador.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo" className="text-white">
                    Tipo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tipo"
                    placeholder="Ex: Apartamento"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("tipo")}
                  />
                  {form.formState.errors.tipo && (
                    <p className="text-sm text-red-500">{form.formState.errors.tipo.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_unidade" className="text-white">
                    Tipo de Unidade
                  </Label>
                  <Select
                    defaultValue={form.getValues("tipo_unidade") || form.getValues("tipo")}
                    onValueChange={(value) => form.setValue("tipo_unidade", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Selecione o tipo de unidade" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                      <SelectItem value="garden">Garden</SelectItem>
                      <SelectItem value="cobertura">Cobertura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pavimento" className="text-white">
                    Pavimento
                  </Label>
                  <Input
                    id="pavimento"
                    type="number"
                    min="0"
                    placeholder="0"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("pavimento")}
                  />
                  {form.formState.errors.pavimento && (
                    <p className="text-sm text-red-500">{form.formState.errors.pavimento.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area_privativa" className="text-white">
                    Área Privativa (m²) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="area_privativa"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("area_privativa")}
                  />
                  {form.formState.errors.area_privativa && (
                    <p className="text-sm text-red-500">{form.formState.errors.area_privativa.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_total" className="text-white">
                    Área Total (m²)
                  </Label>
                  <Input
                    id="area_total"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("area_total")}
                  />
                  {form.formState.errors.area_total && (
                    <p className="text-sm text-red-500">{form.formState.errors.area_total.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Características */}
            <TabsContent value="caracteristicas" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dormitorios" className="text-white">
                    Dormitórios
                  </Label>
                  <Input
                    id="dormitorios"
                    type="number"
                    min="0"
                    placeholder="0"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("dormitorios")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suites" className="text-white">
                    Suítes
                  </Label>
                  <Input
                    id="suites"
                    type="number"
                    min="0"
                    placeholder="0"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("suites")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vagas_simples" className="text-white">
                    Vagas Simples
                  </Label>
                  <Input
                    id="vagas_simples"
                    type="number"
                    min="0"
                    placeholder="0"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("vagas_simples")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vagas_duplas" className="text-white">
                    Vagas Duplas
                  </Label>
                  <Input
                    id="vagas_duplas"
                    type="number"
                    min="0"
                    placeholder="0"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("vagas_duplas")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vagas_moto" className="text-white">
                    Vagas Moto
                  </Label>
                  <Input
                    id="vagas_moto"
                    type="number"
                    min="0"
                    placeholder="0"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("vagas_moto")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hobby_box" className="text-white">
                    Hobby Box
                  </Label>
                  <Input
                    id="hobby_box"
                    type="number"
                    min="0"
                    placeholder="0"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("hobby_box")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orientacao_solar" className="text-white">
                    Orientação Solar
                  </Label>
                  <Select
                    defaultValue={form.getValues("orientacao_solar") || ""}
                    onValueChange={(value) => form.setValue("orientacao_solar", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Selecione a orientação solar" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="nao_definida">Não definida</SelectItem>
                      <SelectItem value="NORTE">Norte</SelectItem>
                      <SelectItem value="SUL">Sul</SelectItem>
                      <SelectItem value="LESTE">Leste</SelectItem>
                      <SelectItem value="OESTE">Oeste</SelectItem>
                      <SelectItem value="NORDESTE">Nordeste</SelectItem>
                      <SelectItem value="NOROESTE">Noroeste</SelectItem>
                      <SelectItem value="SUDESTE">Sudeste</SelectItem>
                      <SelectItem value="SUDOESTE">Sudoeste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Status */}
            <TabsContent value="status" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-white">
                  Status da Unidade
                </Label>
                <Select
                  defaultValue={form.getValues("status") || "disponivel"}
                  onValueChange={(value) => form.setValue("status", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="reservado">Reservado</SelectItem>
                    <SelectItem value="vendido">Vendido</SelectItem>
                    <SelectItem value="indisponivel">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
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
            {isEditing ? "Atualizar" : "Salvar"} Unidade
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
