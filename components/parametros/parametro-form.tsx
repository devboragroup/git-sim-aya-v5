"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  criarParametroPrecificacao,
  atualizarParametroPrecificacao,
  ativarParametroPrecificacao,
} from "@/actions/parametros"
import { Icons } from "@/components/icons"
import type { ParametroPrecificacao, ValorizacaoPavimento } from "@/types/parametros"
import { createClientClient } from "@/lib/supabase/client"
import { Switch } from "@/components/ui/switch"
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

const parametroSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  descricao: z.string().optional(),
  // Valores por m² para diferentes tipos de unidade
  valor_m2_studio: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Valor do m² para studio deve ser um número não negativo",
  }),
  valor_m2_apartamento: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Valor do m² para apartamento deve ser um número não negativo",
  }),
  valor_m2_comercial: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Valor do m² para comercial deve ser um número não negativo",
  }),
  valor_m2_garden: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Valor do m² para garden deve ser um número não negativo",
  }),
  // Valores adicionais
  valor_adicional_suite: z.string().refine((val) => val === "" || !isNaN(Number(val)), {
    message: "Valor adicional por suíte deve ser um número",
  }),
  valor_adicional_vaga_simples: z.string().refine((val) => val === "" || !isNaN(Number(val)), {
    message: "Valor adicional por vaga simples deve ser um número",
  }),
  valor_adicional_vaga_dupla: z.string().refine((val) => val === "" || !isNaN(Number(val)), {
    message: "Valor adicional por vaga dupla deve ser um número",
  }),
  valor_adicional_vaga_moto: z.string().refine((val) => val === "" || !isNaN(Number(val)), {
    message: "Valor adicional por vaga de moto deve ser um número",
  }),
  valor_adicional_hobby_box: z.string().refine((val) => val === "" || !isNaN(Number(val)), {
    message: "Valor adicional por hobby box deve ser um número",
  }),
  // Fatores de orientação solar (8 direções) - Modificado para permitir zero
  fator_norte: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Fator Norte deve ser um número não negativo",
  }),
  fator_sul: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Fator Sul deve ser um número não negativo",
  }),
  fator_leste: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Fator Leste deve ser um número não negativo",
  }),
  fator_oeste: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Fator Oeste deve ser um número não negativo",
  }),
  fator_nordeste: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Fator Nordeste deve ser um número não negativo",
  }),
  fator_noroeste: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Fator Noroeste deve ser um número não negativo",
  }),
  fator_sudeste: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Fator Sudeste deve ser um número não negativo",
  }),
  fator_sudoeste: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Fator Sudoeste deve ser um número não negativo",
  }),
  // Valorizações por pavimento (0 a 20)
  valorizacoes_pavimento: z.record(
    z.string(),
    z.string().refine((val) => val === "" || !isNaN(Number(val)), {
      message: "Percentual de valorização deve ser um número",
    }),
  ),
})

type ParametroFormValues = z.infer<typeof parametroSchema>

interface ParametroFormProps {
  empreendimentoId: string
  parametro?: ParametroPrecificacao
}

export function ParametroForm({ empreendimentoId, parametro }: ParametroFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [numeroPavimentos, setNumeroPavimentos] = useState(20) // Fixo em 20 (total de 21 pavimentos de 0 a 20)
  const [valorizacoesPavimento, setValorizacoesPavimento] = useState<ValorizacaoPavimento[]>([])
  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!parametro
  const supabase = createClientClient()
  const [isActive, setIsActive] = useState(parametro?.ativo || false)
  const [showActivationDialog, setShowActivationDialog] = useState(false)
  const [isActivating, setIsActivating] = useState(false)

  // Buscar valorizações por pavimento se estiver editando
  useEffect(() => {
    if (isEditing && parametro?.id) {
      async function fetchValorizacoes() {
        try {
          const { data, error } = await supabase
            .from("valorizacao_pavimentos")
            .select("*")
            .eq("parametro_id", parametro.id)
            .order("pavimento", { ascending: true })

          if (error) throw error

          setValorizacoesPavimento(data || [])
        } catch (error) {
          console.error("Erro ao buscar valorizações por pavimento:", error)
        }
      }

      fetchValorizacoes()
    }
  }, [isEditing, parametro?.id, supabase])

  // Preparar valores iniciais para valorizações por pavimento
  const valorizacoesInitialValues: { [key: number]: string } = {}
  for (let i = 0; i <= numeroPavimentos; i++) {
    const valorizacao = valorizacoesPavimento.find((v) => v.pavimento === i)
    valorizacoesInitialValues[i] = valorizacao ? valorizacao.percentual.toString() : "0"
  }

  const form = useForm<ParametroFormValues>({
    resolver: zodResolver(parametroSchema),
    defaultValues: {
      nome: parametro?.nome || "",
      descricao: parametro?.descricao || "",
      // Valores por m² para diferentes tipos de unidade
      valor_m2_studio: parametro?.valor_m2_studio?.toString() || "",
      valor_m2_apartamento: parametro?.valor_m2_apartamento?.toString() || "",
      valor_m2_comercial: parametro?.valor_m2_comercial?.toString() || "",
      valor_m2_garden: parametro?.valor_m2_garden?.toString() || "",
      // Valores adicionais
      valor_adicional_suite: parametro?.valor_adicional_suite?.toString() || "0",
      valor_adicional_vaga_simples: parametro?.valor_adicional_vaga_simples?.toString() || "0",
      valor_adicional_vaga_dupla: parametro?.valor_adicional_vaga_dupla?.toString() || "0",
      valor_adicional_vaga_moto: parametro?.valor_adicional_vaga_moto?.toString() || "0",
      valor_adicional_hobby_box: parametro?.valor_adicional_hobby_box?.toString() || "0",
      // Fatores de orientação solar (8 direções)
      fator_norte: parametro?.fator_norte?.toString() || "1",
      fator_sul: parametro?.fator_sul?.toString() || "1",
      fator_leste: parametro?.fator_leste?.toString() || "1",
      fator_oeste: parametro?.fator_oeste?.toString() || "1",
      fator_nordeste: parametro?.fator_nordeste?.toString() || "1",
      fator_noroeste: parametro?.fator_noroeste?.toString() || "1",
      fator_sudeste: parametro?.fator_sudeste?.toString() || "1",
      fator_sudoeste: parametro?.fator_sudoeste?.toString() || "1",
      // Valorizações por pavimento
      valorizacoes_pavimento: valorizacoesInitialValues,
    },
  })

  // Atualizar os valores do formulário quando as valorizações forem carregadas
  useEffect(() => {
    if (valorizacoesPavimento.length > 0) {
      const valorizacoesValues: { [key: number]: string } = {}
      for (let i = 0; i <= numeroPavimentos; i++) {
        const valorizacao = valorizacoesPavimento.find((v) => v.pavimento === i)
        valorizacoesValues[i] = valorizacao ? valorizacao.percentual.toString() : "0"
      }
      form.setValue("valorizacoes_pavimento", valorizacoesValues)
    }
  }, [valorizacoesPavimento, numeroPavimentos, form])

  async function onSubmit(data: ParametroFormValues) {
    setIsLoading(true)

    try {
      // Preparar valorizações por pavimento
      const valorizacoes: ValorizacaoPavimento[] = []
      for (let i = 0; i <= numeroPavimentos; i++) {
        const percentual = data.valorizacoes_pavimento[i] || "0"
        valorizacoes.push({
          parametro_id: parametro?.id || "", // Será preenchido no backend para novos parâmetros
          pavimento: i,
          percentual: Number(percentual),
        })
      }

      if (isEditing && parametro) {
        // Atualizar parâmetro existente
        const result = await atualizarParametroPrecificacao(parametro.id, {
          ...data,
          valorizacoes_pavimento: valorizacoes,
        })

        if (result.error) {
          throw new Error(result.error)
        }

        toast({
          title: "Parâmetro atualizado",
          description: "O parâmetro de precificação foi atualizado com sucesso.",
        })

        router.push(`/empreendimentos/${empreendimentoId}/parametros`)
      } else {
        // Criar novo parâmetro
        const result = await criarParametroPrecificacao(empreendimentoId, {
          ...data,
          valorizacoes_pavimento: valorizacoes,
        })

        if (result.error) {
          throw new Error(result.error)
        }

        toast({
          title: "Parâmetro criado",
          description: "O parâmetro de precificação foi criado com sucesso.",
        })

        router.push(`/empreendimentos/${empreendimentoId}/parametros`)
      }

      router.refresh()
    } catch (error: any) {
      toast({
        title: isEditing ? "Erro ao atualizar parâmetro" : "Erro ao criar parâmetro",
        description: error.message || `Ocorreu um erro ao ${isEditing ? "atualizar" : "criar"} o parâmetro.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleActivateParameter() {
    setIsActivating(true)

    try {
      const result = await ativarParametroPrecificacao(parametro!.id)

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Parâmetro ativado",
        description: "O parâmetro foi ativado e os valores das unidades foram recalculados com sucesso.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro ao ativar parâmetro",
        description: error.message || "Ocorreu um erro ao ativar o parâmetro.",
        variant: "destructive",
      })
    } finally {
      setIsActivating(false)
      setShowActivationDialog(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-white">
                Nome do Parâmetro <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                placeholder="Nome do parâmetro de precificação"
                className="bg-gray-800 border-gray-700 text-white"
                disabled={isLoading}
                {...form.register("nome")}
              />
              {form.formState.errors.nome && (
                <p className="text-sm text-red-500">{form.formState.errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-white">
                Descrição
              </Label>
              <Textarea
                id="descricao"
                placeholder="Descrição do parâmetro"
                className="bg-gray-800 border-gray-700 text-white"
                disabled={isLoading}
                {...form.register("descricao")}
              />
              {form.formState.errors.descricao && (
                <p className="text-sm text-red-500">{form.formState.errors.descricao.message}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="space-y-2 bg-gray-800 p-4 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ativo" className="text-white">
                    Status do Parâmetro
                  </Label>
                  <p className="text-sm text-gray-400">
                    {isActive
                      ? "Este parâmetro está ativo e sendo usado para calcular os valores das unidades."
                      : "Ative este parâmetro para usá-lo no cálculo dos valores das unidades."}
                  </p>
                </div>
                <Switch
                  id="ativo"
                  checked={isActive}
                  onCheckedChange={(checked) => {
                    if (checked && !isActive) {
                      setShowActivationDialog(true)
                    } else {
                      setIsActive(checked)
                    }
                  }}
                  disabled={isLoading || isActive}
                />
              </div>
              {isActive && (
                <p className="text-sm text-aya-green mt-2">
                  Este parâmetro está ativo. Para desativá-lo, ative outro parâmetro.
                </p>
              )}
            </div>
          )}

          <Tabs defaultValue="valores-m2" className="w-full">
            <TabsList className="bg-gray-800 w-full">
              <TabsTrigger
                value="valores-m2"
                className="flex-1 data-[state=active]:bg-aya-green data-[state=active]:text-white"
              >
                Valores por m²
              </TabsTrigger>
              <TabsTrigger
                value="adicionais"
                className="flex-1 data-[state=active]:bg-aya-green data-[state=active]:text-white"
              >
                Valores Adicionais
              </TabsTrigger>
              <TabsTrigger
                value="orientacao"
                className="flex-1 data-[state=active]:bg-aya-green data-[state=active]:text-white"
              >
                Orientação Solar
              </TabsTrigger>
              <TabsTrigger
                value="pavimentos"
                className="flex-1 data-[state=active]:bg-aya-green data-[state=active]:text-white"
              >
                Valorização por Pavimento
              </TabsTrigger>
            </TabsList>

            {/* Valores por m² */}
            <TabsContent value="valores-m2" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_m2_studio" className="text-white">
                    Valor do m² para Studio (R$) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="valor_m2_studio"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("valor_m2_studio")}
                  />
                  {form.formState.errors.valor_m2_studio && (
                    <p className="text-sm text-red-500">{form.formState.errors.valor_m2_studio.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_m2_apartamento" className="text-white">
                    Valor do m² para Apartamento (R$) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="valor_m2_apartamento"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("valor_m2_apartamento")}
                  />
                  {form.formState.errors.valor_m2_apartamento && (
                    <p className="text-sm text-red-500">{form.formState.errors.valor_m2_apartamento.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_m2_comercial" className="text-white">
                    Valor do m² para Comercial (R$) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="valor_m2_comercial"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("valor_m2_comercial")}
                  />
                  {form.formState.errors.valor_m2_comercial && (
                    <p className="text-sm text-red-500">{form.formState.errors.valor_m2_comercial.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_m2_garden" className="text-white">
                    Valor do m² para Garden (R$) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="valor_m2_garden"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("valor_m2_garden")}
                  />
                  {form.formState.errors.valor_m2_garden && (
                    <p className="text-sm text-red-500">{form.formState.errors.valor_m2_garden.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Valores Adicionais */}
            <TabsContent value="adicionais" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valor_adicional_suite" className="text-white">
                  Valor Adicional por Suíte (R$)
                </Label>
                <Input
                  id="valor_adicional_suite"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={isLoading}
                  {...form.register("valor_adicional_suite")}
                />
                {form.formState.errors.valor_adicional_suite && (
                  <p className="text-sm text-red-500">{form.formState.errors.valor_adicional_suite.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_adicional_vaga_simples" className="text-white">
                    Valor Adicional por Vaga Simples (R$)
                  </Label>
                  <Input
                    id="valor_adicional_vaga_simples"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("valor_adicional_vaga_simples")}
                  />
                  {form.formState.errors.valor_adicional_vaga_simples && (
                    <p className="text-sm text-red-500">{form.formState.errors.valor_adicional_vaga_simples.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_adicional_vaga_dupla" className="text-white">
                    Valor Adicional por Vaga Dupla (R$)
                  </Label>
                  <Input
                    id="valor_adicional_vaga_dupla"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("valor_adicional_vaga_dupla")}
                  />
                  {form.formState.errors.valor_adicional_vaga_dupla && (
                    <p className="text-sm text-red-500">{form.formState.errors.valor_adicional_vaga_dupla.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_adicional_vaga_moto" className="text-white">
                    Valor Adicional por Vaga de Moto (R$)
                  </Label>
                  <Input
                    id="valor_adicional_vaga_moto"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("valor_adicional_vaga_moto")}
                  />
                  {form.formState.errors.valor_adicional_vaga_moto && (
                    <p className="text-sm text-red-500">{form.formState.errors.valor_adicional_vaga_moto.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_adicional_hobby_box" className="text-white">
                  Valor Adicional por Hobby Box (R$)
                </Label>
                <Input
                  id="valor_adicional_hobby_box"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="bg-gray-800 border-gray-700 text-white"
                  disabled={isLoading}
                  {...form.register("valor_adicional_hobby_box")}
                />
                {form.formState.errors.valor_adicional_hobby_box && (
                  <p className="text-sm text-red-500">{form.formState.errors.valor_adicional_hobby_box.message}</p>
                )}
              </div>
            </TabsContent>

            {/* Orientação Solar */}
            <TabsContent value="orientacao" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fator_norte" className="text-white">
                    Norte
                  </Label>
                  <Input
                    id="fator_norte"
                    type="number"
                    step="0.01"
                    min=""
                    placeholder="1.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("fator_norte")}
                  />
                  {form.formState.errors.fator_norte && (
                    <p className="text-sm text-red-500">{form.formState.errors.fator_norte.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fator_sul" className="text-white">
                    Sul
                  </Label>
                  <Input
                    id="fator_sul"
                    type="number"
                    step="0.01"
                    min=""
                    placeholder="1.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("fator_sul")}
                  />
                  {form.formState.errors.fator_sul && (
                    <p className="text-sm text-red-500">{form.formState.errors.fator_sul.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fator_leste" className="text-white">
                    Leste
                  </Label>
                  <Input
                    id="fator_leste"
                    type="number"
                    step="0.01"
                    min=""
                    placeholder="1.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("fator_leste")}
                  />
                  {form.formState.errors.fator_leste && (
                    <p className="text-sm text-red-500">{form.formState.errors.fator_leste.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fator_oeste" className="text-white">
                    Oeste
                  </Label>
                  <Input
                    id="fator_oeste"
                    type="number"
                    step="0.01"
                    min=""
                    placeholder="1.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("fator_oeste")}
                  />
                  {form.formState.errors.fator_oeste && (
                    <p className="text-sm text-red-500">{form.formState.errors.fator_oeste.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fator_nordeste" className="text-white">
                    Nordeste
                  </Label>
                  <Input
                    id="fator_nordeste"
                    type="number"
                    step="0.01"
                    min=""
                    placeholder="1.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("fator_nordeste")}
                  />
                  {form.formState.errors.fator_nordeste && (
                    <p className="text-sm text-red-500">{form.formState.errors.fator_nordeste.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fator_noroeste" className="text-white">
                    Noroeste
                  </Label>
                  <Input
                    id="fator_noroeste"
                    type="number"
                    step="0.01"
                    min=""
                    placeholder="1.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("fator_noroeste")}
                  />
                  {form.formState.errors.fator_noroeste && (
                    <p className="text-sm text-red-500">{form.formState.errors.fator_noroeste.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fator_sudeste" className="text-white">
                    Sudeste
                  </Label>
                  <Input
                    id="fator_sudeste"
                    type="number"
                    step="0.01"
                    min=""
                    placeholder="1.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("fator_sudeste")}
                  />
                  {form.formState.errors.fator_sudeste && (
                    <p className="text-sm text-red-500">{form.formState.errors.fator_sudeste.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fator_sudoeste" className="text-white">
                    Sudoeste
                  </Label>
                  <Input
                    id="fator_sudoeste"
                    type="number"
                    step="0.01"
                    min=""
                    placeholder="1.00"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isLoading}
                    {...form.register("fator_sudoeste")}
                  />
                  {form.formState.errors.fator_sudoeste && (
                    <p className="text-sm text-red-500">{form.formState.errors.fator_sudoeste.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Valorização por Pavimento */}
            <TabsContent value="pavimentos" className="mt-4">
              <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-md">
                  <h3 className="text-white text-lg font-medium mb-2">Valorização por Pavimento</h3>
                  <p className="text-gray-400 mb-4">
                    Defina o percentual de valorização para cada pavimento. Valores positivos representam valorização e
                    valores negativos representam desvalorização. Deixe em branco ou zero para pavimentos que não deseja
                    aplicar valorização.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 21 }).map((_, index) => (
                      <div key={index} className="space-y-2">
                        <Label htmlFor={`pavimento_${index}`} className="text-white">
                          Pavimento {index}
                        </Label>
                        <Input
                          id={`pavimento_${index}`}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="bg-gray-700 border-gray-600 text-white"
                          disabled={isLoading}
                          {...form.register(`valorizacoes_pavimento.${index}`)}
                        />
                        {form.formState.errors.valorizacoes_pavimento?.[index] && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.valorizacoes_pavimento[index]?.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
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
            {isEditing ? "Atualizar" : "Salvar"} Parâmetro
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showActivationDialog} onOpenChange={setShowActivationDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Ativar Parâmetro</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Ao ativar este parâmetro, todos os valores das unidades serão recalculados. Este processo pode levar
              alguns segundos.
              <br />
              <br />
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800" disabled={isActivating}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-aya-green hover:bg-opacity-90"
              onClick={(e) => {
                e.preventDefault()
                handleActivateParameter()
              }}
              disabled={isActivating}
            >
              {isActivating ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Ativando...
                </>
              ) : (
                "Sim, ativar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
