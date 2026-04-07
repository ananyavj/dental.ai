import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAuth } from '../contexts/auth-context'

const quickLogins = [
  ['Doctor', 'doc@mail.com', 'doc12345'],
  ['Student', 'stu@mail.com', 'stu12345'],
  ['Patient', 'pat@mail.com', 'pat12345'],
  ['Admin', 'admin@mail.com', 'sudouser123'],
] as const

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, isDemo } = useAuth()
  const [email, setEmail] = useState('doc@mail.com')
  const [password, setPassword] = useState('doc12345')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Signed in')
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Dental.ai</p>
            <h1 className="mt-2 text-3xl font-semibold">Fast clinical workspace</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to dashboard, chatbot, discover, tools, and role-based features.</p>
          </div>

          {isDemo ? (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Supabase is not configured. Add env values to enable real sign-in.
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={event => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input type="password" value={password} onChange={event => setPassword(event.target.value)} />
            </div>
            <Button className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Quick role login</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {quickLogins.map(([label, presetEmail, presetPassword]) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-xl border border-border px-3 py-2 text-left text-sm transition hover:bg-muted/40"
                  onClick={() => {
                    setEmail(presetEmail)
                    setPassword(presetPassword)
                  }}
                >
                  <div className="font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground">{presetEmail}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Link to="/signup" className="hover:text-foreground">Create account</Link>
            <Link to="/forgot-password" className="hover:text-foreground">Forgot password</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
