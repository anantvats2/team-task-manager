import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/projects', label: 'Projects' },
  { to: '/tasks', label: 'Tasks' },
]

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/70">
      {mobileOpen && (
        <button
          className="fixed inset-0 z-20 bg-slate-900/30 md:hidden"
          aria-label="Close menu overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-slate-200/80 bg-white/95 p-4 shadow-soft backdrop-blur transition-all duration-300 md:static md:translate-x-0 md:shadow-none ${collapsed ? 'md:w-24' : ''} ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link to="/dashboard" className={`text-lg font-semibold tracking-tight text-brand-700 ${collapsed ? 'hidden md:block' : ''}`}>
            TeamFlow
          </Link>
          <button onClick={() => setCollapsed((v) => !v)} className="hidden rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 md:block">
            {collapsed ? '>' : '<'}
          </button>
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              {collapsed ? item.label[0] : item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:ml-0">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 px-3 py-3 backdrop-blur-lg sm:px-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <button
              className="rounded-lg border bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition hover:bg-slate-50 md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
            >
              Menu
            </button>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500">{user?.email || 'member@team.com'}</p>
              </div>
              <Button variant="secondary" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
