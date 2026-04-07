import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Globe, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { signIn, signInWithGoogle, isDemo } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      toast.error(error.message || 'Failed to sign in')
    } else {
      toast.success('Welcome back!')
      navigate('/dashboard', { replace: true })
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    setGoogleLoading(false)
    if (error) toast.error(error.message || 'Google sign-in failed')
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center p-4">
      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[400px]"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-[8px] flex items-center justify-center">
            <span className="text-white text-sm font-bold">D</span>
          </div>
          <span className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
            dental<span className="text-primary">.ai</span>
          </span>
        </div>

        <div className="auth-card">
          <h1 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-0.5">
            Welcome back
          </h1>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-6">
            Sign in to your dental.ai account
          </p>

          {/* Demo mode notice */}
          {isDemo && (
            <div className="mb-4 p-3 rounded-[8px] bg-primary-50 border border-primary-100 text-xs text-primary">
              <strong>Demo mode:</strong> Use any email to sign in. Include <code className="bg-primary-100 px-1 rounded">student</code> or <code className="bg-primary-100 px-1 rounded">patient</code> in the email to try those roles.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Email address</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="input-label !mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:text-primary-hover"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light dark:border-border-dark" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 text-xs text-text-muted-light dark:text-text-muted-dark bg-white dark:bg-surface-dark">
                or continue with
              </span>
            </div>
          </div>

          <button
            id="login-google"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="btn-secondary w-full justify-center"
          >
            {googleLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
            <Globe size={15} />
            )}
            {googleLoading ? 'Connecting...' : 'Google'}
          </button>

          <p className="text-center text-sm text-text-muted-light dark:text-text-muted-dark mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:text-primary-hover font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </Motion.div>
    </div>
  )
}
