import { Request } from 'express'

export interface JwtPayload {
  userId: string
  email: string
}

export interface AuthRequest extends Request {
  user?: JwtPayload
}

export interface LyricLine {
  time: number
  text: string
  translation?: string
  duration?: number
  wordTimings?: WordTiming[]
}

export interface WordTiming {
  word: string
  start: number
  end: number
}

export interface ParsedLyrics {
  format: 'lrc' | 'enhanced' | 'qrc' | 'karaoke'
  lines: LyricLine[]
  metadata?: Record<string, string>
}

export interface StreamRange {
  start: number
  end: number
  total: number
}

export interface WSMessage {
  type: 'PLAY' | 'PAUSE' | 'SEEK' | 'SYNC' | 'TRACK_CHANGE' | 'VOLUME' | 'JOIN' | 'LEAVE'
  payload: Record<string, unknown>
  userId?: string
  timestamp?: number
}
