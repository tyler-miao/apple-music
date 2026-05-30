import { GD_API_BASE, API_HOST } from '@/utils/constants'

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
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch(`${this.baseUrl}?types=url&source=${source}&id=${id}&br=${br}`, { signal: controller.signal })
      clearTimeout(timeout)
      const data = await res.json()
      if (!data?.url) return null
      let ref = ''
      if (source === 'bilibili') ref = 'https://www.bilibili.com'
      else if (source === 'netease') ref = 'https://music.163.com'
      else if (source === 'tencent') ref = 'https://y.qq.com'
      return `${API_HOST}/api/audio?url=${encodeURIComponent(data.url)}${ref ? '&ref=' + encodeURIComponent(ref) : ''}`.replace(/(?<!https?:\/\/)\/\/+/g, '/')
    } catch (err) {
      console.error('[GD] url error:', err)
      return null
    }
  }

  async getPic(picId: string, source = 'netease', size = 500): Promise<string | null> {
    try {
      const res = await fetch(`${this.baseUrl}?types=pic&source=${source}&id=${picId}&size=${size}`)
      const data = await res.json()
      if (!data?.url) return null
      return `${API_HOST || ''}/api/cover?url=${encodeURIComponent(data.url)}`
    } catch (err) {
      console.error('[GD] pic error:', err)
      return null
    }
  }

  async getLyric(id: string, source = 'netease'): Promise<{ lyric?: string; tlyric?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}?types=lyric&source=${source}&id=${id}`)
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
