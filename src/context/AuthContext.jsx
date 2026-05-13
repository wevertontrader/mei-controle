import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (!token) {
      if (savedUser) try { setUser(JSON.parse(savedUser)) } catch (_) {}
      setLoading(false)
      return
    }
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser)
        if (u?.email === 'admin@meicontrole.com') u.role = 'super_admin'
        setUser(u)
      } catch (_) {}
    }
    auth.me()
      .then(({ user }) => {
        const u = {
          ...user,
          role: user.email === 'admin@meicontrole.com' ? 'super_admin' : (user.role || 'empresa'),
          sidebar_permissions: Array.isArray(user.sidebar_permissions) ? user.sidebar_permissions : [],
          pdv_logo_url: user.pdv_logo_url || '',
          pdv_empresa_nome: user.pdv_empresa_nome || user.empresa || '',
        }
        setUser(u)
        localStorage.setItem('user', JSON.stringify(u))
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, senha) => {
    const { user, token } = await auth.login(email, senha)
    const u = {
      ...user,
      role: user.email === 'admin@meicontrole.com' ? 'super_admin' : (user.role || 'empresa'),
      sidebar_permissions: Array.isArray(user.sidebar_permissions) ? user.sidebar_permissions : [],
      pdv_logo_url: user.pdv_logo_url || '',
      pdv_empresa_nome: user.pdv_empresa_nome || user.empresa || '',
    }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const register = async (dados) => {
    const { user, token } = await auth.register(dados)
    localStorage.setItem('token', token)
    const u = {
      ...user,
      role: user.role || 'empresa',
      sidebar_permissions: Array.isArray(user.sidebar_permissions) ? user.sidebar_permissions : [],
    }
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = (patch) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...patch }
      if (!Array.isArray(merged.sidebar_permissions)) {
        merged.sidebar_permissions = Array.isArray(prev?.sidebar_permissions) ? prev.sidebar_permissions : []
      }
      if (!('owner_user_id' in patch) && prev?.owner_user_id != null) {
        merged.owner_user_id = prev.owner_user_id
      }
      if (!('pdv_logo_url' in patch) && prev?.pdv_logo_url) {
        merged.pdv_logo_url = prev.pdv_logo_url
      }
      if (!('pdv_empresa_nome' in patch) && prev?.pdv_empresa_nome) {
        merged.pdv_empresa_nome = prev.pdv_empresa_nome
      }
      localStorage.setItem('user', JSON.stringify(merged))
      return merged
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
