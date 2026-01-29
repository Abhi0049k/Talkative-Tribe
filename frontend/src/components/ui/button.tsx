import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold uppercase tracking-wide ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background border-[3px] border-foreground hover:bg-[hsl(var(--secondary))] hover:text-black",
        destructive:
          "bg-[hsl(0,100%,50%)] text-white border-[3px] border-foreground hover:bg-[hsl(0,100%,40%)]",
        outline:
          "border-[3px] border-foreground bg-background hover:bg-[hsl(var(--secondary))] hover:text-black",
        secondary:
          "bg-[hsl(var(--secondary))] text-black border-[3px] border-foreground hover:bg-[hsl(var(--secondary))/80]",
        ghost: "hover:bg-[hsl(var(--muted))] hover:text-foreground border-[3px] border-transparent hover:border-foreground",
        link: "text-foreground underline-offset-4 hover:underline font-bold",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
