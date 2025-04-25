import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardCards } from "@/components/dashboard/dashboard-cards"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"

// Forçar renderização dinâmica para evitar erros com cookies durante o build
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Dashboard - Simulador AYA",
  description: "Visão geral do sistema",
}

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Visão geral dos seus empreendimentos e métricas" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCards />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <DashboardCharts />
      </div>
    </DashboardShell>
  )
}
