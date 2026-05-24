import { Router, Request, Response } from 'express'

interface NeteasePlaylistResponse {
  code: number
  result?: {
    name?: string
    coverImgUrl?: string
    trackCount?: number
    tracks?: Array<{
      id: number
      name: string
      artists?: Array<{ name: string }>
      album?: { name?: string; picId?: number; id?: number }
      duration?: number
    }>
  }
}

interface GDAlbumResponse {
  id: string
  name: string
  artist: string[]
  album: string
  pic_id: string
  lyric_id: string
  source: string
}

const router = Router()

router.get('/fetch', async (req: Request, res: Response) => {
  try {
    const { url } = req.query
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing url parameter' })
    }

    const parsed = parsePlaylistUrl(url)
    if (!parsed) {
      return res.status(400).json({ error: 'Unsupported playlist URL' })
    }

    const { source, id } = parsed

    if (source === 'netease') {
      const apiUrl = `http://music.163.com/api/playlist/detail?id=${id}`
      const response = await fetch(apiUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      })
      if (!response.ok) {
        return res.status(502).json({ error: 'Failed to fetch playlist' })
      }
      const data = (await response.json()) as NeteasePlaylistResponse
      if (data.code !== 200 || !data.result) {
        return res.status(502).json({ error: 'Playlist not found' })
      }
      const result = data.result
      const tracks = (result.tracks || []).map((t) => ({
        id: `netease-${t.id}`,
        title: t.name,
        artist: (t.artists || []).map((a) => a.name).join(' / '),
        album: t.album?.name || '',
        source: 'netease',
        sourceId: String(t.id),
        picId: t.album?.picId ? String(t.album.picId) : t.album?.id ? String(t.album.id) : '',
        lyricId: String(t.id),
        duration: t.duration ? Math.floor(t.duration / 1000) : 0,
      }))
      return res.json({
        name: result.name || '未命名歌单',
        coverImgUrl: result.coverImgUrl || '',
        trackCount: result.trackCount || tracks.length,
        tracks,
      })
    }

    if (source === 'tencent') {
      const gdSearchUrl = `https://music-api.gdstudio.xyz/api.php?types=search&source=tencent&name=${encodeURIComponent(id)}&count=30`
      const response = await fetch(gdSearchUrl)
      if (!response.ok) {
        return res.status(502).json({ error: 'Failed to fetch playlist' })
      }
      const data = (await response.json()) as GDAlbumResponse[]
      const tracks = (Array.isArray(data) ? data : []).map((t) => ({
        id: `tencent-${t.id}`,
        title: t.name,
        artist: (t.artist || []).join(' / '),
        album: t.album || '',
        source: 'tencent',
        sourceId: String(t.id),
        picId: t.pic_id || '',
        lyricId: t.lyric_id || '',
        duration: 0,
      }))
      return res.json({ name: `QQ音乐歌单`, tracks })
    }

    return res.status(400).json({ error: 'Unsupported source' })
  } catch (err: any) {
    console.error('[Playlist] Error:', err)
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
})

function parsePlaylistUrl(url: string): { source: string; id: string } | null {
  try {
    const u = new URL(url)

    if (u.hostname.includes('music.163.com') || u.hostname.includes('163.com')) {
      const id = u.searchParams.get('id')
      if (id) return { source: 'netease', id }
      const match = u.pathname.match(/\/playlist\/(\d+)/)
      if (match) return { source: 'netease', id: match[1] }
    }

    if (u.hostname.includes('y.qq.com') || u.hostname.includes('music.qq.com')) {
      const match = u.pathname.match(/\/playlist\/(\d+)/)
      if (match) return { source: 'tencent', id: match[1] }
    }

    if (url.startsWith('netease:')) {
      return { source: 'netease', id: url.replace('netease:', '') }
    }
    if (url.startsWith('qq:')) {
      return { source: 'tencent', id: url.replace('qq:', '') }
    }
    if (/^\d{6,}$/.test(url.trim())) {
      return { source: 'netease', id: url.trim() }
    }

    return null
  } catch {
    if (/^\d{6,}$/.test(url.trim())) {
      return { source: 'netease', id: url.trim() }
    }
    return null
  }
}

export default router
