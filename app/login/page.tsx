import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Login - Simulador AYA",
  description: "Faça login para acessar o sistema",
}

export default function LoginPage() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-aya-dark-gray lg:flex dark:border-r">
        <div className="absolute inset-0 bg-aya-light-gray" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Image
            src="/logo-aya-fundo-claro.png"
            alt="AYA Estratégia Imobiliária"
            width={200}
            height={60}
            className="w-auto h-16"
          />
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg text-aya-dark-gray">
              Gerencie seus empreendimentos imobiliários com precisão e eficiência.
            </p>
            <footer className="text-sm text-gray-600">Simulador AYA</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8 bg-aya-dark-gray">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Bem-vindo ao Simulador AYA</h1>
            <p className="text-sm text-gray-400">Entre com seu e-mail e senha para acessar o sistema</p>
          </div>
          <LoginForm />
          <p className="px-8 text-center text-sm text-gray-400">
            Ao continuar, você concorda com nossos{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-aya-green">
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-aya-green">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
