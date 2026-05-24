import { api } from './api'
import { Music } from '@/types'

interface MusicListResponse {
  musics: Music[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const musicService = {
  list: (page = 1, limit = 20, search?: string) =>
    api.get<MusicListResponse>(`/music?page=${page}&limit=${limit}${search ? `&search=${search}` : ''}`),

  detail: (id: string) => api.get<Music>(`/music/${id}`),

  getUrl: (id: string) => api.get<{ url: string }>(`/music/${id}/url`),

  recordPlay: (id: string) => api.post(`/music/${id}/play`),

  toggleLike: (id: string) => api.post<{ liked: boolean }>(`/music/${id}/like`),
}
