import { create } from 'zustand'
import { LyricLine, ParsedLyrics } from '@/types'

interface LyricState {
  lyrics: LyricLine[]
  currentLineIndex: number
  format: string
  metadata: Record<string, string>
  isLoaded: boolean

  setLyrics: (parsed: ParsedLyrics) => void
  setCurrentLineIndex: (index: number) => void
  reset: () => void
}

export const useLyricStore = create<LyricState>((set) => ({
  lyrics: [],
  currentLineIndex: -1,
  format: 'lrc',
  metadata: {},
  isLoaded: false,

  setLyrics: (parsed) =>
    set({
      lyrics: parsed.lines,
      format: parsed.format,
      metadata: parsed.metadata || {},
      isLoaded: true,
      currentLineIndex: -1,
    }),

  setCurrentLineIndex: (index) => set({ currentLineIndex: index }),

  reset: () =>
    set({
      lyrics: [],
      currentLineIndex: -1,
      format: 'lrc',
      metadata: {},
      isLoaded: false,
    }),
}))
