import { Link, useNavigate } from 'react-router-dom'
import { signOut } from '@/lib/auth'

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <nav className="flex items-center gap-6">
          <Link to="/" className="font-semibold text-gray-900">
            OKR Ops Tracker
          </Link>
          <Link to="/" className="text-gray-600 hover:text-gray-900 text-sm">
            Home
          </Link>
          <Link to="/board" className="text-gray-600 hover:text-gray-900 text-sm">
            Team Board
          </Link>
          <Link to="/director" className="text-gray-600 hover:text-gray-900 text-sm">
            Director
          </Link>
        </nav>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Sign out
        </button>
      </header>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}
