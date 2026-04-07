import * as React from 'react'
import { cn } from '../../lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/20',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
