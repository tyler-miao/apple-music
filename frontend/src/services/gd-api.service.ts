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

  private searchController: AbortController | null = null

  async search(keyword: string, source = 'netease', count = 20, pages = 1): Promise<GDSearchItem[]> {
    if (this.searchController) this.searchController.abort()
    this.searchController = new AbortController()
    const { signal } = this.searchController

    const url = `${this.baseUrl}?types=search&source=${source}&name=${encodeURIComponent(keyword)}&count=${count}&pages=${pages}`
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, { signal })
        if (!res.ok) return []
        const data = await res.json()
        if (Array.isArray(data)) return data
      } catch (err: any) {
        if (err?.name === 'AbortError') return []
        if (attempt === 0) await new Promise(r => setTimeout(r, 600))
      }
    }
    return []
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

  private picCache = new Map<string, string>()

  async getPic(picId: string, source = 'netease', size = 500): Promise<string | null> {
    const cacheKey = `${source}:${picId}`
    const cached = this.picCache.get(cacheKey)
    if (cached) return cached
    try {
      const res = await fetch(`${this.baseUrl}?types=pic&source=${source}&id=${picId}&size=${size}`)
      const data = await res.json()
      if (!data?.url) return null
      this.picCache.set(cacheKey, data.url)
      return data.url
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
