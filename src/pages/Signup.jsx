import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Stethoscope, GraduationCap, User, Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ROLES = [
  {
    id: 'doctor',
    icon: Stethoscope,
    label: 'Doctor / Dentist',
    description: 'Full access to clinical tools, patient directory, and AI co-pilot',
    badge: 'bg-primary-50 text-primary border-primary-100',
    activeBorder: 'border-primary',
    activeBg: 'bg-primary-50',
  },
  {
    id: 'student',
    icon: GraduationCap,
    label: 'Dental Student',
    description: 'Study tools, MCQ practice, viva prep, and chatbot access',
    badge: 'bg-green-50 text-success border-green-100',
    activeBorder: 'border-success',
    activeBg: 'bg-green-50/50',
  },
  {
    id: 'patient',
    icon: User,
    label: 'Patient',
    description: 'Ask dental questions, explore research, watch educational videos',
    badge: 'bg-gray-50 text-gray-600 border-gray-200',
    activeBorder: 'border-gray-400',
    activeBg: 'bg-gray-50',
  },
]

export default function Signup() {
  const [step, setStep] = useState(1) // 1=role, 2=details
  const [role, setRole] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    institution: '',
    email: '',
    password: '',
    confirm_password: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleNext = () => {
    if (!role) return toast.error('Please select a role')
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name) return toast.error('Full name is required')
    if (!form.email) return toast.error('Email is required')
    if (form.password.length < 6) return toast.error('Password must be 6+ characters')
    if (form.password !== form.confirm_password) return toast.error('Passwords do not match')

    setLoading(true)
    const { error } = await signUp(form.email, form.password, {
      full_name: form.full_name,
      institution: form.institution,
      role,
    })
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Sign up failed')
    } else {
      toast.success('Account created! Welcome to dental.ai')
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center p-4">
      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[480px]"
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
          {step === 1 && (
            <Motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-0.5">
                Create your account
              </h1>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-6">
                I am a...
              </p>

              <div className="space-y-3">
                {ROLES.map(({ id, icon, label, description, activeBorder, activeBg }) => (
                  <button
                    key={id}
                    id={`role-${id}`}
                    onClick={() => setRole(id)}
                    className={`w-full flex items-start gap-3 p-4 rounded-[8px] border text-left transition-all duration-150 ${
                      role === id
                        ? `${activeBorder} ${activeBg} border-2`
                        : 'border-border-light dark:border-border-dark hover:border-primary/30'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0 ${
                      role === id ? 'bg-white dark:bg-surface-dark' : 'bg-bg-light dark:bg-bg-dark'
                    }`}>
                      {icon({ size: 18, className: role === id ? 'text-primary' : 'text-text-muted-light dark:text-text-muted-dark' })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{label}</p>
                      <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">{description}</p>
                    </div>
                    {role === id && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                id="signup-next"
                onClick={handleNext}
                className="btn-primary w-full justify-center mt-6"
              >
                Continue
              </button>

              <p className="text-center text-sm text-text-muted-light dark:text-text-muted-dark mt-4">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-primary-hover font-medium">
                  Sign in
                </Link>
              </p>
            </Motion.div>
          )}

          {step === 2 && (
            <Motion.div key="step2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-text-muted-light dark:text-text-muted-dark hover:text-primary mb-4 flex items-center gap-1"
              >
                ← Back
              </button>
              <h1 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-0.5">
                Your details
              </h1>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-6">
                Setting up as: <span className="font-medium capitalize text-primary">{role}</span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="input-label">Full name *</label>
                  <input
                    id="signup-name"
                    className="input-field"
                    placeholder={role === 'doctor' ? 'Dr. Priya Sharma' : 'Your full name'}
                    value={form.full_name}
                    onChange={e => handleChange('full_name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label">
                    {role === 'doctor' ? 'Clinic / Hospital name' : role === 'student' ? 'College / University' : 'City (optional)'}
                  </label>
                  <input
                    id="signup-institution"
                    className="input-field"
                    placeholder={
                      role === 'doctor' ? 'Sharma Dental Clinic, Mumbai' :
                      role === 'student' ? 'Manipal College of Dental Sciences' :
                      'Mumbai, India'
                    }
                    value={form.institution}
                    onChange={e => handleChange('institution', e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label">Email address *</label>
                  <input
                    id="signup-email"
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label">Password *</label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPass ? 'text' : 'password'}
                      className="input-field pr-10"
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={e => handleChange('password', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="input-label">Confirm password *</label>
                  <input
                    id="signup-confirm-password"
                    type={showPass ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Repeat password"
                    value={form.confirm_password}
                    onChange={e => handleChange('confirm_password', e.target.value)}
                  />
                </div>

                <button
                  id="signup-submit"
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center mt-2"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            </Motion.div>
          )}
        </div>
      </Motion.div>
    </div>
  )
}
