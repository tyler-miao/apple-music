import { Request, Response, NextFunction } from 'express'
import { MusicService } from '../services/music.service'
import { AuthRequest } from '../types'

const service = new MusicService()

export class MusicController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const search = req.query.search as string | undefined
      const result = await service.getMusics(page, limit, search)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const music = await service.getMusicById(req.params.id)
      res.json(music)
    } catch (err) {
      next(err)
    }
  }

  async getUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getMusicUrl(req.params.id)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async stream(req: Request, res: Response, next: NextFunction) {
    try {
      const music = await service.getMusicById(req.params.id)
      if (music.filePath) {
        const { StreamService } = require('../utils/stream')
        const path = require('path')
        const config = require('../config').default
        StreamService.streamAudio(path.join(config.uploadDir, music.filePath), req, res)
      } else if (music.audioUrl) {
        res.redirect(music.audioUrl)
      } else {
        res.status(404).json({ error: '音频源未找到' })
      }
    } catch (err) {
      next(err)
    }
  }

  async recordPlay(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await service.recordPlay(req.user!.userId, req.params.id)
      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  }

  async getLiked(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await service.getLikedMusic(req.user!.userId)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async toggleLike(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, artist, album, coverUrl, source, sourceId } = req.body
      const result = await service.toggleLike(req.user!.userId, req.params.id, { title, artist, album, coverUrl, source, sourceId })
      res.json(result)
    } catch (err) {
      next(err)
    }
  }
}
