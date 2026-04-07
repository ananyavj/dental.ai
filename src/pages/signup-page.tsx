import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAuth } from '../contexts/auth-context'
import type { Role } from '../types'

export function SignupPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [form, setForm] = useState({
    fullName: '',
    institution: '',
    email: '',
    password: '',
    role: 'doctor' as Role,
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const { error } = await signUp(form)
    if (error) {
      if (error.message.toLowerCase().includes('rate limit')) {
        toast.error('Supabase email sending is rate-limited. Use the demo logins for now, or disable email confirmation / configure custom SMTP in Supabase Auth.')
      } else {
        toast.error(error.message)
      }
      return
    }
    toast.success('Account created. Check email if confirmation is enabled.')
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Dental.ai</p>
            <h1 className="mt-2 text-3xl font-semibold">Create account</h1>
          </div>
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Supabase’s built-in email provider only allows a very small number of signup emails. If you see “email rate limit exceeded”, either use the seeded demo accounts or disable email confirmation / configure custom SMTP in Supabase Dashboard → Auth.
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input placeholder="Full name" value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} />
            <Input placeholder="Institution or clinic" value={form.institution} onChange={event => setForm({ ...form, institution: event.target.value })} />
            <Input placeholder="Email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
            <Input type="password" placeholder="Password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
            <select
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              value={form.role}
              onChange={event => setForm({ ...form, role: event.target.value as Role })}
            >
              <option value="doctor">Doctor</option>
              <option value="student">Student</option>
              <option value="patient">Patient</option>
              <option value="admin">Admin</option>
            </select>
            <Button className="w-full">Create account</Button>
          </form>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Back to login</Link>
        </CardContent>
      </Card>
    </div>
  )
}
