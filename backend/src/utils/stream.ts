import { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { StreamRange } from '../types'

export class StreamService {
  static streamAudio(filePath: string, req: Request, res: Response): void {
    try {
      const stat = fs.statSync(filePath)
      const fileSize = stat.size
      const range = req.headers.range

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
        const chunkSize = end - start + 1

        const streamRange: StreamRange = { start, end, total: fileSize }
        const stream = fs.createReadStream(filePath, { start, end })

        const ext = path.extname(filePath).toLowerCase()
        const mimeMap: Record<string, string> = {
          '.mp3': 'audio/mpeg',
          '.wav': 'audio/wav',
          '.flac': 'audio/flac',
          '.aac': 'audio/aac',
          '.ogg': 'audio/ogg',
          '.m4a': 'audio/mp4',
        }

        res.writeHead(206, {
          'Content-Range': `bytes ${streamRange.start}-${streamRange.end}/${streamRange.total}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeMap[ext] || 'audio/mpeg',
        })

        stream.pipe(res)
        stream.on('error', () => {
          if (!res.headersSent) res.status(500).end()
        })
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': 'audio/mpeg',
          'Accept-Ranges': 'bytes',
        })
        fs.createReadStream(filePath).pipe(res)
      }
    } catch {
      res.status(404).json({ error: '文件未找到' })
    }
  }
}
