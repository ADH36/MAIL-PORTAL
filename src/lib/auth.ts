/**
 * Email Portal Authentication Store
 * Zustand store for managing authentication state
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>
  checkAuth: () => Promise<void>
}

const API_BASE = '/api'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          if (response.ok && data.success) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
            })
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: data.error || 'Login failed' }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Network error' }
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
          })

          const data = await response.json()

          if (response.ok && data.success) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
            })
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: data.error || 'Registration failed' }
          }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: 'Network error' }
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      updateUser: async (userData: Partial<User>) => {
        const { token } = get()
        if (!token) return { success: false, error: 'Not authenticated' }

        try {
          const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(userData),
          })

          const data = await response.json()

          if (response.ok && data.success) {
            set({ user: data.user })
            return { success: true }
          } else {
            return { success: false, error: data.error || 'Update failed' }
          }
        } catch (error) {
          return { success: false, error: 'Network error' }
        }
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) return

        try {
          const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              set({ user: data.user, isAuthenticated: true })
            } else {
              set({ user: null, token: null, isAuthenticated: false })
            }
          } else {
            set({ user: null, token: null, isAuthenticated: false })
          }
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)