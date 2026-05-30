export const API_BASE = '/api'
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || ''
export const API_HOST = process.env.NEXT_PUBLIC_API_HOST || ''

export const GLASS_MODES = [
  { bg: 'rgba(0,0,0,0.2)', filter: 'blur(40px) saturate(200%)', label: '默认' },
  { bg: 'rgba(255,255,255,0.05)', filter: 'blur(60px) saturate(250%)', label: '通透' },
  { bg: 'rgba(0,0,0,0.6)', filter: 'blur(20px) saturate(100%)', label: '专注' },
]

export const GD_API_BASE = '/api/proxy/gd'

export const PLAYBACK_MODES = ['sequential', 'repeat', 'shuffle'] as const

export const LYRIC_FADE_GRADIENT = {
  mask: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
} as const
