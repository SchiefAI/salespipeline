import { useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthGuard'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  // Get user initials or first letter of email
  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.[0].toUpperCase() ?? '?'
  }

  const avatarUrl = user?.user_metadata?.avatar_url

  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      {/* Header */}
      <header className="bg-white border-b-2 border-[#1a1a1a] sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo / App name */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#e05a28] border-2 border-[#1a1a1a] flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h1 className="font-display text-xl font-semibold text-[#1a1a1a]">// Dealflow</h1>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-[#f5f1eb] transition-colors"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-8 h-8 border-2 border-[#1a1a1a] object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-[#f5f1eb] text-[#1a1a1a] border-2 border-[#1a1a1a] flex items-center justify-center text-sm font-medium">
                    {getInitials()}
                  </div>
                )}
                <svg
                  className={`w-4 h-4 text-[#1a1a1a] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] py-1 z-20">
                    <div className="px-4 py-2 border-b-2 border-[#1a1a1a]/10">
                      <p className="text-sm font-medium text-[#1a1a1a] truncate">
                        {user?.user_metadata?.full_name ?? 'Gebruiker'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        signOut()
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-[#f5f1eb] flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Uitloggen
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] border-t-2 border-[#1a1a1a] px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/60 font-mono">
            // Dealflow — Een{' '}
            <a
              href="https://thinkahead.digital"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#e05a28] hover:text-white transition-colors"
            >
              Think Ahead
            </a>
            {' '}project
          </p>
          <p className="text-xs text-white/40 font-mono">
            {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
}
