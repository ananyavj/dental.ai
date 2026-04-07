import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAuth } from '../contexts/auth-context'

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const { error } = await resetPassword(email)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Password reset email sent')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Dental.ai</p>
            <h1 className="mt-2 text-3xl font-semibold">Reset password</h1>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input placeholder="Email" value={email} onChange={event => setEmail(event.target.value)} />
            <Button className="w-full">Send reset link</Button>
          </form>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Back to login</Link>
        </CardContent>
      </Card>
    </div>
  )
}
