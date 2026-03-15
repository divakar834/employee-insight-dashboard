import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
const SESSION_KEY = 'eid_session'
const DEMO_USER = 'testuser'
const DEMO_PASS = 'Test123'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [user])

  function login(username, password) {
    setError('')

    if (username === DEMO_USER && password === DEMO_PASS) {
      setUser({ username, loggedInAt: Date.now() })
      return true
    }

    setError('Invalid username or password')
    return false
  }

  function logout() {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, error, setError, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
