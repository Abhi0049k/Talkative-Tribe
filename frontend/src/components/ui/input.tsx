import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full border-[3px] border-foreground bg-background px-4 py-2 text-sm font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-bold placeholder:text-muted-foreground placeholder:uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--secondary))] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
