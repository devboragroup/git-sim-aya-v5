import Link from "next/link"
import Image from "next/image"

export function MainNav() {
  return (
    <div className="flex items-center space-x-4 lg:space-x-6">
      <Link href="/dashboard" className="flex items-center space-x-2">
        <Image src="/logo-aya.png" alt="AYA Estratégia Imobiliária" width={120} height={36} className="h-8 w-auto" />
      </Link>
    </div>
  )
}
