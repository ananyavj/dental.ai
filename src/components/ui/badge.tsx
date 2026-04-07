import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium', {
  variants: {
    variant: {
      default: 'bg-muted text-foreground',
      success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
      warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
      danger: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
      info: 'bg-primary/10 text-primary',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
