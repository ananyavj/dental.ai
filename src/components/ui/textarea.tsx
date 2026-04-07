import * as React from 'react'
import { cn } from '../../lib/utils'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[110px] w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/20',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
