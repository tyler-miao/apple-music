import { api } from './api'
import { User } from '@/types'

interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export const authService = {
  register: (email: string, username: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { email, username, password }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  profile: () => api.get<User>('/auth/profile'),
}
