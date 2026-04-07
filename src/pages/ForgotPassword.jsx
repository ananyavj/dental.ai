import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Loader2, Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email')
    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) {
      toast.error(error.message || 'Failed to send reset email')
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center p-4">
      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[400px]"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-[8px] flex items-center justify-center">
            <span className="text-white text-sm font-bold">D</span>
          </div>
          <span className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
            dental<span className="text-primary">.ai</span>
          </span>
        </div>

        <div className="auth-card">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={22} className="text-primary" />
              </div>
              <h2 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                Check your inbox
              </h2>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                We sent a password reset link to <strong className="text-text-primary-light dark:text-text-primary-dark">{email}</strong>
              </p>
              <Link to="/login" className="btn-ghost text-sm mt-6 inline-flex">
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-0.5">
                Forgot password?
              </h1>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="input-label">Email address</label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <button
                  id="forgot-submit"
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <p className="text-center text-sm text-text-muted-light dark:text-text-muted-dark mt-5">
                <Link to="/login" className="text-primary hover:text-primary-hover font-medium">
                  ← Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </Motion.div>
    </div>
  )
}
