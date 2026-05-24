import { PrismaClient } from '@prisma/client'
import { LRCParser } from '../utils/lrc-parser'
import { AppError } from '../middleware/error'

const prisma = new PrismaClient()

interface GDResponse {
  lyric?: string
  tlyric?: string
  code?: number
}

export class LyricsService {
  async getLyrics(musicId: string) {
    const lyrics = await prisma.lyrics.findUnique({
      where: { musicId_source: { musicId, source: 'local' } },
    })
    if (!lyrics) throw new AppError(404, '歌词未找到')
    return lyrics
  }

  async uploadLyrics(musicId: string, content: string, translated?: string) {
    const music = await prisma.music.findUnique({ where: { id: musicId } })
    if (!music) throw new AppError(404, '音乐未找到')

    const parsed = LRCParser.parse(content)
    const timeline = LRCParser.generateTimeline(parsed.lines)

    const data = {
      musicId,
      content,
      translated: translated || null,
      format: parsed.format,
      timestamps: JSON.parse(JSON.stringify(timeline)),
    }

    const existing = await prisma.lyrics.findUnique({
      where: { musicId_source: { musicId, source: 'local' } },
    })

    if (existing) {
      return prisma.lyrics.update({
        where: { id: existing.id },
        data,
      })
    }

    return prisma.lyrics.create({ data: { ...data, source: 'local' } })
  }

  async fetchFromGDService(source: string, id: string) {
    try {
      const res = await fetch(`https://music-api.gdstudio.xyz/api.php?types=lyric&source=${source}&id=${id}`)
      const data = await res.json() as GDResponse
      if (data.lyric) {
        return this.uploadLyrics(id, data.lyric, data.tlyric)
      }
      throw new AppError(404, '歌词未找到')
    } catch {
      throw new AppError(502, '获取歌词失败')
    }
  }
}
