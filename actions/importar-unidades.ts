"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"

interface ImportResult {
  success: boolean
  totalProcessed: number
  totalImported: number
  totalErrors: number
  errors?: Array<{ row: number; message: string }>
}

export async function importarUnidades(formData: FormData): Promise<ImportResult> {
  const supabase = createServerClient()

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      success: false,
      totalProcessed: 0,
      totalImported: 0,
      totalErrors: 1,
      errors: [{ row: 0, message: "Usuário não autenticado" }],
    }
  }

  try {
    const empreendimentoId = formData.get("empreendimentoId") as string
    const file = formData.get("file") as File

    if (!empreendimentoId) {
      return {
        success: false,
        totalProcessed: 0,
        totalImported: 0,
        totalErrors: 1,
        errors: [{ row: 0, message: "ID do empreendimento não fornecido" }],
      }
    }

    if (!file) {
      return {
        success: false,
        totalProcessed: 0,
        totalImported: 0,
        totalErrors: 1,
        errors: [{ row: 0, message: "Nenhum arquivo fornecido" }],
      }
    }

    // Ler o arquivo
    const fileBuffer = await file.arrayBuffer()
    let data: any[] = []
    const errors: Array<{ row: number; message: string }> = []

    // Verificar o tipo de arquivo
    if (file.name.endsWith(".csv")) {
      // Processar CSV
      const text = new TextDecoder().decode(fileBuffer)
      data = parseCSV(text)
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      // Processar Excel
      const workbook = XLSX.read(fileBuffer)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      data = XLSX.utils.sheet_to_json(worksheet)
    } else {
      return {
        success: false,
        totalProcessed: 0,
        totalImported: 0,
        totalErrors: 1,
        errors: [{ row: 0, message: "Formato de arquivo não suportado. Use CSV ou Excel (.csv, .xls, .xlsx)" }],
      }
    }

    if (data.length === 0) {
      return {
        success: false,
        totalProcessed: 0,
        totalImported: 0,
        totalErrors: 1,
        errors: [{ row: 0, message: "Arquivo vazio ou sem dados válidos" }],
      }
    }

    // Validar e preparar os dados
    const unidadesParaInserir = []
    let rowIndex = 1 // Começar em 1 para contar o cabeçalho

    for (const row of data) {
      rowIndex++
      try {
        // Validar campos obrigatórios
        if (!row.identificador) {
          errors.push({ row: rowIndex, message: "Identificador é obrigatório" })
          continue
        }

        if (!row.tipo) {
          errors.push({ row: rowIndex, message: `Tipo é obrigatório para a unidade ${row.identificador}` })
          continue
        }

        if (!row.area_privativa || isNaN(Number(row.area_privativa)) || Number(row.area_privativa) <= 0) {
          errors.push({
            row: rowIndex,
            message: `Área privativa deve ser um número maior que zero para a unidade ${row.identificador}`,
          })
          continue
        }

        // Verificar se já existe uma unidade com o mesmo identificador
        const { data: existingUnidade } = await supabase
          .from("unidades")
          .select("id")
          .eq("empreendimento_id", empreendimentoId)
          .eq("identificador", row.identificador)
          .maybeSingle()

        if (existingUnidade) {
          errors.push({
            row: rowIndex,
            message: `Já existe uma unidade com o identificador ${row.identificador} neste empreendimento`,
          })
          continue
        }

        // Preparar dados para inserção
        unidadesParaInserir.push({
          empreendimento_id: empreendimentoId,
          identificador: row.identificador,
          tipo: row.tipo,
          area_privativa: Number(row.area_privativa),
          area_total: row.area_total ? Number(row.area_total) : Number(row.area_privativa),
          pavimento: row.pavimento ? Number(row.pavimento) : null,
          dormitorios: row.dormitorios ? Number(row.dormitorios) : null,
          suites: row.suites ? Number(row.suites) : null,
          vagas: row.vagas ? Number(row.vagas) : null,
          vagas_simples: row.vagas_simples ? Number(row.vagas_simples) : null,
          vagas_duplas: row.vagas_duplas ? Number(row.vagas_duplas) : null,
          vagas_moto: row.vagas_moto ? Number(row.vagas_moto) : null,
          hobby_box: row.hobby_box ? Number(row.hobby_box) : null,
          orientacao_solar: row.orientacao_solar || null,
          status: row.status || "disponivel",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      } catch (error) {
        errors.push({
          row: rowIndex,
          message: `Erro ao processar linha: ${error instanceof Error ? error.message : String(error)}`,
        })
      }
    }

    // Se não houver unidades válidas para inserir
    if (unidadesParaInserir.length === 0) {
      return {
        success: false,
        totalProcessed: data.length,
        totalImported: 0,
        totalErrors: errors.length,
        errors,
      }
    }

    // Inserir unidades em lote
    const { data: insertedUnidades, error: insertError } = await supabase
      .from("unidades")
      .insert(unidadesParaInserir)
      .select()

    if (insertError) {
      console.error("Erro ao inserir unidades:", insertError)
      return {
        success: false,
        totalProcessed: data.length,
        totalImported: 0,
        totalErrors: errors.length + unidadesParaInserir.length, // Considera erros de inserção
        errors: [
          ...errors,
          ...unidadesParaInserir.map((unidade, index) => ({
            row: index + 1, // Ajustar a linha para corresponder à unidade
            message: `Erro ao inserir unidade: ${insertError.message}`,
          })),
        ],
      }
    }

    revalidatePath("/dashboard/empreendimentos/[id]", "page")
    revalidatePath("/dashboard/empreendimentos/[id]/unidades", "page")
    revalidatePath(`/dashboard/empreendimentos/${empreendimentoId}`, "page")
    revalidatePath(`/dashboard/empreendimentos/${empreendimentoId}/unidades`, "page")

    return {
      success: true,
      totalProcessed: data.length,
      totalImported: insertedUnidades.length,
      totalErrors: errors.length,
      errors,
    }
  } catch (error) {
    console.error("Erro durante a importação:", error)
    return {
      success: false,
      totalProcessed: 0,
      totalImported: 0,
      totalErrors: 1,
      errors: [{ row: 0, message: `Erro inesperado: ${error instanceof Error ? error.message : String(error)}` }],
    }
  }
}

function parseCSV(text: string): any[] {
  const lines = text.split("\n")
  const headers = lines[0].split(",")

  const result = []

  for (let i = 1; i < lines.length; i++) {
    const data = lines[i].split(",")
    if (data.length === headers.length) {
      const obj: any = {}
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j].trim()] = data[j].trim()
      }
      result.push(obj)
    }
  }

  return result
}
