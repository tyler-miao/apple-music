import { Request, Response, NextFunction } from 'express'
import { LyricsService } from '../services/lyrics.service'

const service = new LyricsService()

export class LyricsController {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const lyrics = await service.getLyrics(req.params.musicId)
      res.json(lyrics)
    } catch (err) {
      next(err)
    }
  }

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const { musicId, content, translated } = req.body
      if (!musicId || !content) {
        return res.status(400).json({ error: '缺少必要参数' })
      }
      const result = await service.uploadLyrics(musicId, content, translated)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async fetchFromGD(req: Request, res: Response, next: NextFunction) {
    try {
      const { source, id } = req.query
      if (!source || !id) {
        return res.status(400).json({ error: '缺少必要参数' })
      }
      const result = await service.fetchFromGDService(source as string, id as string)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }
}
