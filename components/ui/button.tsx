import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-3 border-black [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 touch-target active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-brutal-yellow text-black shadow-brutal hover:bg-brutal-orange hover:shadow-brutal-hover hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        destructive:
          "bg-red-500 text-white shadow-brutal hover:bg-red-600 hover:shadow-brutal-hover hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        outline:
          "bg-white text-black shadow-brutal hover:bg-gray-100 hover:shadow-brutal-hover hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        secondary:
          "bg-brutal-blue text-white shadow-brutal hover:bg-blue-600 hover:shadow-brutal-hover hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        ghost:
          "border-0 shadow-none hover:bg-black/5 hover:shadow-none",
        link:
          "border-0 shadow-none text-black underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-lg",
        icon: "h-12 w-12",
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
