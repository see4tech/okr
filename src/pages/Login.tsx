import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signInWithPassword, signUp } from '@/lib/auth'
import { ui } from '@/lib/i18n'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isSignUp) {
        await signUp(email, password)
        setPassword('')
        setError(ui.checkEmail)
        return
      }
      await signInWithPassword(email, password)
      navigate(from, { replace: true })
      window.location.reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : ui.authFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 px-4">
      <div className="w-full max-w-sm">
        
        {/* Logo */}
        <div className="text-center mb-10">
          <img
            src="/logo.png"
            alt={ui.appName}
            className="h-56 w-auto mx-auto mb-1 drop-shadow-xl"
          />
          <p className="text-brand-300 text-sm">
            Sistema de seguimiento de OKRs
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            {isSignUp ? ui.signUp : ui.signIn}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {ui.email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {ui.password}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isSignUp}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 py-2.5 px-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 shadow-sm"
            >
              {loading ? '...' : isSignUp ? ui.signUp : ui.signIn}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setIsSignUp((v: boolean) => !v)
              setError(null)
            }}
            className="mt-4 w-full text-sm text-brand-600 hover:text-brand-800 font-medium"
          >
            {isSignUp ? ui.alreadyHaveAccount : ui.needAccount}
          </button>
        </div>

      </div>
    </div>
  )
}