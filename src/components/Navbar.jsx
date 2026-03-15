import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const links = [
    { to: '/list',      label: 'Employees' },
    { to: '/analytics', label: 'Analytics' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-slate-border bg-ink/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <NavLink to="/list" className="flex items-center gap-2 group">
          <span className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="#0D0D0D"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="#0D0D0D"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="#0D0D0D"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="#0D0D0D" opacity="0.4"/>
            </svg>
          </span>
          <span className="font-display font-bold text-sm tracking-tight text-white group-hover:text-accent transition-colors">
            EID
          </span>
        </NavLink>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-body transition-all duration-150 ` +
                (isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-slate-card')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-mono hidden sm:block">
            {user?.username}
          </span>
          <button onClick={handleLogout} className="btn-ghost text-xs py-1.5 px-3">
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
