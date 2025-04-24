import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { EmpreendimentosList } from "@/components/empreendimentos/empreendimentos-list"
import { EmpreendimentosActions } from "@/components/empreendimentos/empreendimentos-actions"

export const metadata: Metadata = {
  title: "Empreendimentos - Simulador AYA",
  description: "Gerenciamento de empreendimentos",
}

export default function EmpreendimentosPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Empreendimentos" text="Gerencie seus empreendimentos imobiliários">
        <EmpreendimentosActions />
      </DashboardHeader>
      <EmpreendimentosList />
    </DashboardShell>
  )
}
