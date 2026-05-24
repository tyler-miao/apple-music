'use client'

import { create } from 'zustand'

interface User {
  id: string
  email: string
  username: string
  bio?: string
  role: string
  avatar?: string | null
  createdAt?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, username: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
  updateAvatar: (avatarUrl: string) => Promise<void>
  updateBio: (bio: string) => Promise<void>
}

function loadTokens() {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null }
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  }
}

const { accessToken: initAT, refreshToken: initRT } = loadTokens()

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: initAT,
  refreshToken: initRT,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { set({ isLoading: false, error: data.error || '登录失败' }); return false }
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isLoading: false })
      return true
    } catch {
      set({ isLoading: false, error: '网络错误，请检查服务器' })
      return false
    }
  },

  register: async (email, username, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      })
      const data = await res.json()
      if (!res.ok) { set({ isLoading: false, error: data.error || '注册失败' }); return false }
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isLoading: false })
      return true
    } catch {
      set({ isLoading: false, error: '网络错误，请检查服务器' })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, accessToken: null, refreshToken: null })
  },

  clearError: () => set({ error: null }),

  updateAvatar: async (avatarUrl) => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/auth/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatarUrl }),
      })
      if (res.ok) {
        const user = await res.json()
        set({ user })
      }
    } catch {}
  },

  updateBio: async (bio) => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/auth/bio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bio }),
      })
      if (res.ok) {
        const user = await res.json()
        set({ user })
      }
    } catch {}
  },
}))
