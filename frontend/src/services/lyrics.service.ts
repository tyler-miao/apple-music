import { api } from './api'

interface LyricsData {
  id: string
  musicId: string
  content: string
  translated?: string | null
  format: string
  timestamps: any
}

export const lyricsService = {
  get: (musicId: string) => api.get<LyricsData>(`/lyrics/${musicId}`),

  upload: (musicId: string, content: string, translated?: string) =>
    api.post<LyricsData>('/lyrics/upload', { musicId, content, translated }),

  fetchFromGD: (source: string, id: string) =>
    api.get<LyricsData>(`/lyrics/fetch/gd?source=${source}&id=${id}`),
}
