import { create } from 'zustand'
import { Music } from '@/types'

export interface HistoryEntry {
  music: Music
  playedAt: number
}

interface HistoryState {
  entries: HistoryEntry[]
  addEntry: (music: Music) => void
  clearHistory: () => void
}

const STORAGE_KEY = 'play_history'
const MAX_ENTRIES = 100

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: loadHistory(),

  addEntry: (music) => {
    const { entries } = get()
    const filtered = entries.filter((e) => e.music.id !== music.id)
    const updated = [{ music, playedAt: Date.now() }, ...filtered].slice(0, MAX_ENTRIES)
    set({ entries: updated })
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  },

  clearHistory: () => {
    set({ entries: [] })
    try { localStorage.setItem(STORAGE_KEY, '[]') } catch {}
  },
}))
