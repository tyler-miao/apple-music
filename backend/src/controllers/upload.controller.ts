import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import config from '../config'
import { AppError } from '../middleware/error'

const prisma = new PrismaClient()

export class UploadController {
  async uploadMusic(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new AppError(400, '请选择文件')
      const file = req.file
      const { title, artist, album } = req.body

      const music = await prisma.music.create({
        data: {
          title: title || path.parse(file.originalname).name,
          artist: artist || '未知艺术家',
          album: album || null,
          filePath: file.filename,
          fileSize: file.size,
          mimeType: file.mimetype,
          duration: 0,
        },
      })

      const { FFmpegService } = await import('../services/ffmpeg.service')
      const duration = await FFmpegService.getDuration(file.path)
      await prisma.music.update({ where: { id: music.id }, data: { duration } })

      const coverPath = await FFmpegService.extractCover(file.path)
      if (coverPath) {
        const coverUrl = `/uploads/${path.basename(coverPath)}`
        await prisma.music.update({ where: { id: music.id }, data: { coverUrl } })
      }

      res.status(201).json(music)
    } catch (err) {
      next(err)
    }
  }

  async uploadCover(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new AppError(400, '请选择图片')
      const coverUrl = `/uploads/${req.file.filename}`
      res.json({ url: coverUrl })
    } catch (err) {
      next(err)
    }
  }
}
