import { API_BASE } from '@/utils/constants'

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string | null) {
    this.token = token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`

    const res = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers })

    if (res.status === 401) {
      this.token = null
      throw new Error('未授权')
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '请求失败' }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    return res.json()
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint)
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) })
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) })
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const headers: Record<string, string> = {}
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`

    const res = await fetch(`${this.baseUrl}${endpoint}`, { method: 'POST', body: formData, headers })
    if (!res.ok) throw new Error('上传失败')
    return res.json()
  }
}

export const api = new ApiClient(API_BASE)
