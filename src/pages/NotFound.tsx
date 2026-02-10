import { Link } from 'react-router-dom'
import { ui } from '@/lib/i18n'

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-semibold text-gray-900">404</h1>
      <p className="mt-2 text-gray-600">{ui.pageNotFound}</p>
      <Link to="/" className="mt-4 text-brand-600 hover:text-brand-800 hover:underline font-medium">
        {ui.goHome}
      </Link>
    </div>
  )
}
