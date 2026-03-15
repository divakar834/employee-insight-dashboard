import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'

export default function Login() {
  const { login, error, setError } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname ?? '/list'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const ok = login(username.trim(), password)
    setLoading(false)
    if (ok) navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-accent-blue/5 rounded-full blur-3xl" />
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6EE7B7" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="w-full max-w-md animate-fade-in relative">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 mb-5">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="10" height="10" rx="2" fill="#6EE7B7"/>
              <rect x="16" y="2" width="10" height="10" rx="2" fill="#6EE7B7" opacity="0.5"/>
              <rect x="2" y="16" width="10" height="10" rx="2" fill="#6EE7B7" opacity="0.5"/>
              <rect x="16" y="16" width="10" height="10" rx="2" fill="#6EE7B7" opacity="0.2"/>
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            Employee Insights
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-body">
            Sign in to access the dashboard
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="testuser"
                className="input-field"
                autoComplete="username"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  className="input-field pr-12"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPass
                    ? <EyeOff size={16} />
                    : <EyeOn  size={16} />
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-accent-fire/10 border border-accent-fire/30 rounded-lg px-3 py-2">
                <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                  <circle cx="7" cy="7" r="6" stroke="#F87171" strokeWidth="1.5"/>
                  <path d="M7 4v4" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="7" cy="10" r="0.75" fill="#F87171"/>
                </svg>
                <span className="text-accent-fire text-sm">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Hint */}
          <p className="text-center text-xs text-gray-600 mt-5 font-mono">
            demo: testuser / Test123
          </p>
        </div>
      </div>
    </div>
  )
}

// Inline SVG icon components — no icon library
function EyeOn({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <ellipse cx="8" cy="8" rx="6" ry="4" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
    </svg>
  )
}
function EyeOff({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 16 16">
      <path d="M2 2l12 12M6.5 5.5A3.5 3.5 0 0 1 8 5c3 0 5 3 5 3a9 9 0 0 1-1.5 1.8M4.2 9.8A9 9 0 0 1 3 8s2-3 5-3c.5 0 1 .07 1.4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
