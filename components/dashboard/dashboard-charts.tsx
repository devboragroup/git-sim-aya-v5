"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardCharts() {
  return (
    <>
      <Card className="col-span-4 bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-200">VGV por Empreendimento</CardTitle>
          <CardDescription className="text-gray-400">
            Distribuição do Valor Geral de Vendas por empreendimento
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px] flex items-center justify-center text-gray-500">Nenhum dado disponível</div>
        </CardContent>
      </Card>
      <Card className="col-span-3 bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-200">Status das Unidades</CardTitle>
          <CardDescription className="text-gray-400">Distribuição de unidades por status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500">Nenhum dado disponível</div>
        </CardContent>
      </Card>
    </>
  )
}
