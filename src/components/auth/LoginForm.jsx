import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function LoginForm({ onSwitchToSignup }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      navigate('/dashboard')
    }
  }

  async function handleOAuth(provider) {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <div className="w-full max-w-[420px] flex flex-col form-fade-in">
      {/* Mobile brand */}
      <div className="lg:hidden mb-12 flex items-center gap-2">
        <div className="primary-gradient p-1.5 rounded-lg">
          <span
            className="material-symbols-outlined text-on-primary text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            grid_view
          </span>
        </div>
        <span className="text-lg font-bold tracking-tight text-on-background">BuildBoard</span>
      </div>

      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Welcome Back</h1>
        <p className="mt-2 text-on-surface-variant text-lg">Access your team's project workspace.</p>
      </div>

      {/* Social logins */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => handleOAuth('google')}
          type="button"
          className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-lowest border border-outline-variant/20 rounded-lg hover:bg-surface-container-low transition-colors duration-200 active:scale-95"
        >
          <GoogleIcon />
          <span className="text-sm font-semibold">Google</span>
        </button>
        <button
          onClick={() => handleOAuth('github')}
          type="button"
          className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-lowest border border-outline-variant/20 rounded-lg hover:bg-surface-container-low transition-colors duration-200 active:scale-95"
        >
          <GitHubIcon />
          <span className="text-sm font-semibold">GitHub</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
          <span className="bg-surface px-4 text-on-surface-variant/40">Or continue with email</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-error-container/20 border border-error/20 rounded-lg text-sm text-error">
          {error}
        </div>
      )}

      {/* Form */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-on-surface-variant" htmlFor="login-email">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-lg py-3.5 px-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-on-surface-variant" htmlFor="login-password">
              Password
            </label>
            <a className="text-xs font-bold text-primary hover:text-primary-dim transition-colors" href="#">
              Forgot password?
            </a>
          </div>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-lg py-3.5 px-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-outline-variant/30 text-primary focus:ring-primary accent-primary"
          />
          <label className="text-sm text-on-surface-variant font-medium cursor-pointer" htmlFor="remember">
            Stay signed in for 30 days
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 primary-gradient text-on-primary font-bold rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            'Sign In to Workspace'
          )}
        </button>
      </form>

      <p className="mt-10 text-center text-sm text-on-surface-variant">
        New to BuildBoard?{' '}
        <button
          onClick={onSwitchToSignup}
          className="font-bold text-primary hover:underline underline-offset-4"
        >
          Create an account
        </button>
      </p>

      <div className="mt-auto pt-12 flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/40">
        <a className="hover:text-on-surface transition-colors" href="#">Terms</a>
        <a className="hover:text-on-surface transition-colors" href="#">Privacy</a>
        <a className="hover:text-on-surface transition-colors" href="#">Status</a>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg className="w-5 h-5 fill-on-surface" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}
