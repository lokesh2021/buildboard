import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LeftPanel from '../components/auth/LeftPanel'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignupForm'

export default function AuthPage() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [formKey, setFormKey] = useState(0) // forces re-mount for animation

  function switchToSignup() {
    setMode('signup')
    setFormKey((k) => k + 1)
  }

  function switchToLogin() {
    setMode('login')
    setFormKey((k) => k + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (session) return <Navigate to="/dashboard" replace />

  return (
    <main className="flex min-h-screen">
      <LeftPanel mode={mode} />

      {/* Right: form area */}
      <section
        className={`w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 ${
          mode === 'login' ? 'bg-surface' : 'bg-surface-container-lowest'
        }`}
      >
        {mode === 'login' ? (
          <LoginForm key={`login-${formKey}`} onSwitchToSignup={switchToSignup} />
        ) : (
          <SignupForm key={`signup-${formKey}`} onSwitchToLogin={switchToLogin} />
        )}
      </section>

      {/* Global decorative blurs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/3 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-tertiary/3 rounded-full blur-[120px]" />
      </div>

      {/* Noise overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>
    </main>
  )
}
