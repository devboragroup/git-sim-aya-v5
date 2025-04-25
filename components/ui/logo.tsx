import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  variant?: "light" | "dark"
  size?: "sm" | "md" | "lg"
  href?: string
}

export function Logo({ variant = "light", size = "md", href = "/" }: LogoProps) {
  // URL externa do logo
  const logoUrl = "https://ayaestrategia.com.br/images/aya/logo-aya.png"

  // Definir dimensões com base no tamanho
  const dimensions = {
    sm: { width: 80, height: 24 },
    md: { width: 120, height: 36 },
    lg: { width: 160, height: 48 },
  }

  const { width, height } = dimensions[size]

  // Wrapper com classes condicionais baseadas na variante
  const wrapperClasses = `flex items-center ${variant === "dark" ? "bg-white rounded-md p-1" : ""}`

  const logo = (
    <div className={wrapperClasses}>
      <Image
        src={logoUrl || "/placeholder.svg"}
        alt="Logo AYA"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
    </div>
  )

  // Se tiver href, envolve em um Link
  if (href) {
    return <Link href={href}>{logo}</Link>
  }

  return logo
}
