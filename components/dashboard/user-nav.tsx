"use client"

import Link from "next/link"
import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { serverLogout } from "@/actions/auth"
import { Icons } from "@/components/icons"
import { useToast } from "@/components/ui/use-toast"

interface UserNavProps {
  user: User
}

export function UserNav({ user }: UserNavProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { toast } = useToast()
  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : "U"
  const email = user.email || "Usuário"

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      toast({
        title: "Saindo...",
        description: "Você será redirecionado para a página de login",
      })

      // A Server Action irá redirecionar automaticamente
      await serverLogout()

      // Isso só será executado se o redirecionamento falhar
      window.location.href = "/login"
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar sair. Por favor, tente novamente.",
        variant: "destructive",
      })
      setIsLoggingOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} alt={email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{email}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.id}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/perfil">Perfil</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/configuracoes">Configurações</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Saindo...
            </>
          ) : (
            "Sair"
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
