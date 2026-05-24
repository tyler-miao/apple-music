export interface Music {
  id: string
  title: string
  artist: string
  album?: string | null
  coverUrl?: string | null
  audioUrl?: string | null
  duration: number
  trackNumber?: number | null
  genre?: string | null
  playCount: number
  source?: string
  sourceId?: string
  picId?: string
  lyricId?: string
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

export interface Album {
  id: string
  title: string
  artist: string
  coverUrl?: string | null
  year?: number | null
  genre?: string | null
}

export interface Artist {
  id: string
  name: string
  bio?: string | null
  avatarUrl?: string | null
  genre?: string | null
}

export interface Playlist {
  id: string
  name: string
  description?: string | null
  coverUrl?: string | null
  isPublic: boolean
  userId: string
  items: PlaylistItem[]
}

export interface PlaylistItem {
  id: string
  playlistId: string
  musicId: string
  position: number
  music: Music
}

export interface User {
  id: string
  email: string
  username: string
  avatar?: string | null
}

export interface PlayerState {
  currentMusic: Music | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playbackMode: 'sequential' | 'repeat' | 'shuffle'
}

export interface UIState {
  isLyricsFullscreen: boolean
  glassMode: number
  isSidebarOpen: boolean
  currentView: 'player' | 'library' | 'search' | 'playlist'
}
