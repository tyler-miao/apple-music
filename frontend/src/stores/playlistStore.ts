import { create } from 'zustand'
import { Music } from '@/types'

export interface Playlist {
  id: string
  name: string
  description: string
  songs: Music[]
  createdAt: number
  source?: string
  sourceUrl?: string
}

interface PlaylistState {
  playlists: Playlist[]
  createPlaylist: (name: string, description?: string) => string | null
  deletePlaylist: (id: string) => void
  renamePlaylist: (id: string, name: string) => void
  addSongToPlaylist: (playlistId: string, song: Music) => void
  removeSongFromPlaylist: (playlistId: string, songId: string) => void
  importFromSource: (name: string, songs: Music[], source: string) => string | null
}

const STORAGE_KEY = 'user_playlists'

function loadPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: loadPlaylists(),

  createPlaylist: (name, description = '') => {
    const playlist: Playlist = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      description,
      songs: [],
      createdAt: Date.now(),
    }
    const updated = [...get().playlists, playlist]
    set({ playlists: updated })
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
    return playlist.id
  },

  deletePlaylist: (id) => {
    const updated = get().playlists.filter((p) => p.id !== id)
    set({ playlists: updated })
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  },

  renamePlaylist: (id, name) => {
    const updated = get().playlists.map((p) => p.id === id ? { ...p, name } : p)
    set({ playlists: updated })
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  },

  addSongToPlaylist: (playlistId, song) => {
    const updated = get().playlists.map((p) => {
      if (p.id !== playlistId) return p
      if (p.songs.some((s) => s.id === song.id)) return p
      return { ...p, songs: [...p.songs, song] }
    })
    set({ playlists: updated })
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  },

  removeSongFromPlaylist: (playlistId, songId) => {
    const updated = get().playlists.map((p) => {
      if (p.id !== playlistId) return p
      return { ...p, songs: p.songs.filter((s) => s.id !== songId) }
    })
    set({ playlists: updated })
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  },

  importFromSource: (name, songs, source) => {
    const playlist: Playlist = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: `${name} (${source})`,
      description: `从 ${source} 导入`,
      songs,
      createdAt: Date.now(),
      source,
    }
    const updated = [...get().playlists, playlist]
    set({ playlists: updated })
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
    return playlist.id
  },
}))
