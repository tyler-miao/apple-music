import { GD_API_BASE } from '@/utils/constants'

export interface GDSearchItem {
  id: string
  name: string
  artist: string[]
  album: string
  pic_id: string
  lyric_id: string
  source: string
}

export class GDService {
  private baseUrl = GD_API_BASE

  async search(keyword: string, source = 'netease', count = 20, pages = 1): Promise<GDSearchItem[]> {
    const url = `${this.baseUrl}?types=search&source=${source}&name=${encodeURIComponent(keyword)}&count=${count}&pages=${pages}`
    try {
      const res = await fetch(url)
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : []
    } catch (err) {
      console.error('[GD] search error:', err)
      return []
    }
  }

  async getUrl(id: string, source = 'netease', br = 320): Promise<string | null> {
    const url = `${this.baseUrl}?types=url&source=${source}&id=${id}&br=${br}`
    try {
      const res = await fetch(url)
      const data = await res.json()
      if (!data?.url) return null
      const audioUrl = data.url
      if (source === 'bilibili') {
        return `/api/audio?url=${encodeURIComponent(audioUrl)}&ref=${encodeURIComponent('https://www.bilibili.com')}`
      }
      return audioUrl
    } catch (err) {
      console.error('[GD] url error:', err)
      return null
    }
  }

  async getPic(picId: string, source = 'netease', size = 500): Promise<string | null> {
    const url = `${this.baseUrl}?types=pic&source=${source}&id=${picId}&size=${size}`
    try {
      const res = await fetch(url)
      const data = await res.json()
      if (!data?.url) return null
      return `/api/cover?url=${encodeURIComponent(data.url)}`
    } catch (err) {
      console.error('[GD] pic error:', err)
      return null
    }
  }

  async getLyric(id: string, source = 'netease'): Promise<{ lyric?: string; tlyric?: string }> {
    const url = `${this.baseUrl}?types=lyric&source=${source}&id=${id}`
    try {
      const res = await fetch(url)
      const data = await res.json()
      return {
        lyric: data?.lyric || undefined,
        tlyric: data?.tlyric || undefined,
      }
    } catch (err) {
      console.error('[GD] lyric error:', err)
      return {}
    }
  }
}

export const gdService = new GDService()
