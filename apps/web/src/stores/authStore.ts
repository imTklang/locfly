import { create } from 'zustand'

interface User {
  id: string
  email: string
  name?: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

function loadFromStorage(): Pick<AuthState, 'user' | 'token'> {
  try {
    const token = localStorage.getItem('locfly_token')
    const raw = localStorage.getItem('locfly_user')
    const user = raw ? (JSON.parse(raw) as User) : null
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadFromStorage(),
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => {
    localStorage.removeItem('locfly_token')
    localStorage.removeItem('locfly_user')
    set({ user: null, token: null })
  },
}))
