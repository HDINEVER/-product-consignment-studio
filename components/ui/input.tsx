import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
    return (
      <div className="relative group">
        {icon && (
          <div className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 z-10",
            isFocused ? "text-brutal-black scale-110" : "text-gray-400"
          )}>
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-14 w-full rounded-xl border-3 border-black bg-white px-4 py-2 text-base font-medium",
            "shadow-brutal ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-gray-400 placeholder:font-normal",
            "focus-visible:outline-none focus-visible:ring-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-300 ease-out",
            "hover:shadow-brutal-hover hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-gray-50",
            "focus:shadow-brutal-md focus:translate-x-[-3px] focus:translate-y-[-3px] focus:bg-white",
            icon && "pl-12",
            className
          )}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {/* Focus indicator - subtle shadow glow instead of yellow border */}
        <div className={cn(
          "absolute inset-0 rounded-xl pointer-events-none transition-all duration-300",
          isFocused ? "ring-2 ring-black/20 ring-offset-2" : "opacity-0"
        )} />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
