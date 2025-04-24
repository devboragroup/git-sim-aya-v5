"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, DollarSign } from "lucide-react"

export function DashboardCards() {
  return (
    <>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">Empreendimentos</CardTitle>
          <Building2 className="h-4 w-4 text-aya-green" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">0</div>
          <p className="text-xs text-gray-400">Empreendimentos ativos</p>
        </CardContent>
      </Card>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">Unidades</CardTitle>
          <Building2 className="h-4 w-4 text-aya-green" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">0</div>
          <p className="text-xs text-gray-400">Unidades cadastradas</p>
        </CardContent>
      </Card>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">VGV Total</CardTitle>
          <DollarSign className="h-4 w-4 text-aya-green" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">R$ 0,00</div>
          <p className="text-xs text-gray-400">Valor Geral de Vendas</p>
        </CardContent>
      </Card>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">Usuários</CardTitle>
          <Users className="h-4 w-4 text-aya-green" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">0</div>
          <p className="text-xs text-gray-400">Usuários ativos</p>
        </CardContent>
      </Card>
    </>
  )
}
