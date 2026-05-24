import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import config from '../config'
import { AppError } from '../middleware/error'

const prisma = new PrismaClient()

export class MusicService {
  async getMusics(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { artist: { contains: search, mode: 'insensitive' as const } },
            { album: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined

    const [musics, total] = await Promise.all([
      prisma.music.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.music.count({ where }),
    ])

    return { musics, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getMusicById(id: string) {
    const music = await prisma.music.findUnique({
      where: { id },
      include: { lyrics: true, albumRel: true },
    })
    if (!music) throw new AppError(404, '音乐未找到')
    await prisma.music.update({ where: { id }, data: { playCount: { increment: 1 } } })
    return music
  }

  async getMusicUrl(id: string) {
    const music = await prisma.music.findUnique({ where: { id } })
    if (!music) throw new AppError(404, '音乐未找到')
    if (music.audioUrl) return { url: music.audioUrl }
    const filePath = path.join(config.uploadDir, music.filePath || '')
    if (!fs.existsSync(filePath)) throw new AppError(404, '音频文件未找到')
    return { url: `/api/music/stream/${id}`, filePath }
  }

  async recordPlay(userId: string, musicId: string) {
    await prisma.playHistory.create({ data: { userId, musicId } })
    await prisma.music.update({ where: { id: musicId }, data: { playCount: { increment: 1 } } })
  }

  async getLikedMusic(userId: string) {
    const liked = await prisma.likedMusic.findMany({
      where: { userId },
      orderBy: { likedAt: 'desc' },
    })
    return liked.map((item) => ({
      likedAt: item.likedAt,
      musicId: item.musicId,
      title: item.title,
      artist: item.artist,
      album: item.album,
      coverUrl: item.coverUrl,
      source: item.source,
      sourceId: item.sourceId,
    }))
  }

  async toggleLike(userId: string, musicId: string, meta?: { title?: string; artist?: string; album?: string; coverUrl?: string; source?: string; sourceId?: string }) {
    const existing = await prisma.likedMusic.findUnique({
      where: { userId_musicId: { userId, musicId } },
    })
    if (existing) {
      await prisma.likedMusic.delete({ where: { userId_musicId: { userId, musicId } } })
      return { liked: false }
    }
    await prisma.likedMusic.create({
      data: {
        userId,
        musicId,
        title: meta?.title || '',
        artist: meta?.artist || '',
        album: meta?.album || '',
        coverUrl: meta?.coverUrl || null,
        source: meta?.source || '',
        sourceId: meta?.sourceId || null,
      },
    })
    return { liked: true, musicId, title: meta?.title, artist: meta?.artist }
  }
}
