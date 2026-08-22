import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAppAuth } from '../context/AppAuthContext'

export default function LoginPage() {
  const { user, loading, signIn, signUp } = useAppAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={location.state?.from || '/'} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    if (mode === 'signin') {
      const { error: err } = await signIn(email, password)
      if (err) setError(err.message)
      else navigate(location.state?.from || '/', { replace: true })
    } else {
      const { error: err } = await signUp(email, password, fullName)
      if (err) setError(err.message)
      else setInfo('Account created. It now needs to be approved by an Admin before you can sign in — check back once you\'ve been approved.')
    }

    setSubmitting(false)
  }

  const inputClass =
    'w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-slate-500'

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm bg-slate-800 rounded-xl border border-slate-700 p-8">
        <p className="text-blue-400 text-xs font-medium uppercase tracking-widest mb-2">OAHRIS</p>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          Admin, Researcher, and Student all sign in here — access is based on your account role.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          )}
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-emerald-900 border border-emerald-700 rounded-lg p-3 text-emerald-200 text-sm">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
            setError(null)
            setInfo(null)
          }}
          className="mt-5 text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
