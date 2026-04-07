import * as React from 'react'
import { cn } from '../../lib/utils'

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  tabs: Array<{ value: string; label: string }>
  className?: string
}

export function SegmentedTabs({ value, onValueChange, tabs, className }: TabsProps) {
  return (
    <div className={cn('inline-flex rounded-xl border border-border bg-muted/40 p-1', className)}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onValueChange(tab.value)}
          className={cn(
            'rounded-lg px-3 py-2 text-sm transition-all duration-150',
            value === tab.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
