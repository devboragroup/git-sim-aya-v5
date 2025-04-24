"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { LayoutDashboard, Building2, BarChart3, Users, Settings } from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
  },
  {
    title: "Empreendimentos",
    href: "/empreendimentos",
    icon: <Building2 className="mr-2 h-4 w-4" />,
  },
  {
    title: "Relatórios",
    href: "/relatorios",
    icon: <BarChart3 className="mr-2 h-4 w-4" />,
  },
  {
    title: "Usuários",
    href: "/usuarios",
    icon: <Users className="mr-2 h-4 w-4" />,
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: <Settings className="mr-2 h-4 w-4" />,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href
              ? "bg-aya-green bg-opacity-20 text-aya-green hover:bg-opacity-30 hover:text-aya-green"
              : "text-gray-400 hover:bg-gray-800 hover:text-white",
            "justify-start",
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
