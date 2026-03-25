import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function SignupForm({ onSwitchToLogin }) {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!fullName || !email || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!/\d/.test(password)) {
      setError('Password must contain at least one number.')
      return
    }

    setLoading(true)
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else if (data.session) {
      navigate('/dashboard')
    } else {
      setMessage('Check your email to confirm your account, then sign in.')
    }
  }

  async function handleOAuth(provider) {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <div className="w-full max-w-md flex flex-col form-fade-in">
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

      <div className="mb-10 text-center lg:text-left">
        <h2 className="text-3xl font-bold text-on-background tracking-tight mb-2">
          Start building together
        </h2>
        <p className="text-on-surface-variant">Create an account for your team.</p>
      </div>

      {/* Social logins */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => handleOAuth('google')}
          type="button"
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-surface-container-low hover:bg-surface-container-high transition-colors rounded-lg text-sm font-medium border border-outline-variant/10"
        >
          <GoogleIcon />
          <span>Google</span>
        </button>
        <button
          onClick={() => handleOAuth('github')}
          type="button"
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-surface-container-low hover:bg-surface-container-high transition-colors rounded-lg text-sm font-medium border border-outline-variant/10"
        >
          <GitHubIcon />
          <span>GitHub</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant/15" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest text-on-surface-variant bg-surface-container-lowest px-4">
          Or sign up with email
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="mb-4 p-3 bg-error-container/20 border border-error/20 rounded-lg text-sm text-error">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 p-3 bg-primary-container/30 border border-primary/20 rounded-lg text-sm text-on-primary-container">
          {message}
        </div>
      )}

      {/* Form */}
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2"
            htmlFor="signup-name"
          >
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface placeholder:text-on-surface-variant/40"
          />
        </div>

        <div>
          <label
            className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2"
            htmlFor="signup-email"
          >
            Email Address
          </label>
          <input
            id="signup-email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface placeholder:text-on-surface-variant/40"
          />
        </div>

        <div>
          <label
            className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2"
            htmlFor="signup-password"
          >
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface placeholder:text-on-surface-variant/40"
          />
          <p className="mt-2 text-[11px] text-on-surface-variant">
            Must be at least 8 characters with one number.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full primary-gradient text-on-primary font-semibold py-3.5 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Create Account</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-10 pt-8 border-t border-outline-variant/10 text-center">
        <p className="text-sm text-on-surface-variant">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-primary font-semibold hover:underline underline-offset-4 ml-1"
          >
            Sign in
          </button>
        </p>
        <p className="mt-6 text-[10px] text-on-surface-variant/50 max-w-xs mx-auto leading-relaxed">
          By signing up, you agree to our{' '}
          <a className="underline" href="#">Terms of Service</a> and{' '}
          <a className="underline" href="#">Privacy Policy</a>.
        </p>
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
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}
