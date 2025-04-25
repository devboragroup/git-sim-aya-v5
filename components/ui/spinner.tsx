import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(({ className, ...props }, ref) => {
  return <Loader2 ref={ref} className={cn("animate-spin", className)} {...props} />
})
Spinner.displayName = "Spinner"

export { Spinner }
