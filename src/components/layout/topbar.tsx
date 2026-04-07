import { Moon, Sun } from 'lucide-react'
import { Button } from '../ui/button'

export function Topbar({
  dark,
  onToggleTheme,
  onSignOut,
}: {
  dark: boolean
  onToggleTheme: () => void
  onSignOut: () => Promise<void>
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Dental.ai</p>
        <p className="text-sm text-foreground">Fast-loading clinical workspace</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="icon" onClick={onToggleTheme}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="secondary" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
