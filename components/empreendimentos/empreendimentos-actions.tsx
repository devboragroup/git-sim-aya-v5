import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function EmpreendimentosActions() {
  return (
    <Button className="bg-aya-green hover:bg-opacity-90" asChild>
      <Link href="/empreendimentos/novo">
        <Plus className="mr-2 h-4 w-4" />
        Novo Empreendimento
      </Link>
    </Button>
  )
}
