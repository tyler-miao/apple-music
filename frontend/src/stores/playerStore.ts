import { create } from 'zustand'
import { Music } from '@/types'

interface PlayerState {
  currentMusic: Music | null
  queue: Music[]
  queueIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playbackMode: 'sequential' | 'repeat' | 'shuffle'
  audioElement: HTMLAudioElement | null

  setCurrentMusic: (music: Music) => void
  setQueue: (queue: Music[], startIndex?: number) => void
  togglePlay: () => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  nextTrack: () => void
  prevTrack: () => void
  cyclePlaybackMode: () => void
  addToQueue: (music: Music) => void
  removeFromQueue: (index: number) => void
  seek: (time: number) => void
  setAudioElement: (el: HTMLAudioElement | null) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentMusic: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.75,
  isMuted: false,
  playbackMode: 'sequential',
  audioElement: null,

  setCurrentMusic: (music) => {
    const { queue } = get()
    const idx = queue.findIndex((m) => m.id === music.id)
    if (idx >= 0) {
      set({ currentMusic: music, queueIndex: idx, currentTime: 0 })
    } else {
      const newQueue = [...queue, music]
      set({ queue: newQueue, queueIndex: newQueue.length - 1, currentMusic: music, currentTime: 0 })
    }
  },

  setQueue: (queue, startIndex = 0) => {
    const music = queue[startIndex]
    set({ queue, queueIndex: startIndex, currentMusic: music || null, currentTime: 0 })
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  nextTrack: () => {
    const { queue, queueIndex, playbackMode } = get()
    if (queue.length === 0) return
    let nextIdx: number
    if (playbackMode === 'shuffle') {
      nextIdx = Math.floor(Math.random() * queue.length)
    } else if (playbackMode === 'repeat') {
      nextIdx = queueIndex
    } else {
      nextIdx = queueIndex + 1
      if (nextIdx >= queue.length) nextIdx = 0
    }
    set({ queueIndex: nextIdx, currentMusic: queue[nextIdx], currentTime: 0, isPlaying: true })
  },

  prevTrack: () => {
    const { queue, queueIndex, currentTime } = get()
    if (queue.length === 0) return
    if (currentTime > 3) {
      set({ currentTime: 0 })
      const { audioElement } = get()
      if (audioElement) audioElement.currentTime = 0
      return
    }
    const prevIdx = queueIndex - 1 < 0 ? queue.length - 1 : queueIndex - 1
    set({ queueIndex: prevIdx, currentMusic: queue[prevIdx], currentTime: 0, isPlaying: true })
  },

  cyclePlaybackMode: () => {
    const modes: PlayerState['playbackMode'][] = ['sequential', 'repeat', 'shuffle']
    const { playbackMode } = get()
    const idx = modes.indexOf(playbackMode)
    set({ playbackMode: modes[(idx + 1) % modes.length] })
  },

  addToQueue: (music) => {
    const { queue } = get()
    if (queue.find((m) => m.id === music.id)) return
    set({ queue: [...queue, music] })
  },

  removeFromQueue: (index) => {
    const { queue, queueIndex } = get()
    const newQueue = queue.filter((_, i) => i !== index)
    const newIndex = index < queueIndex ? queueIndex - 1 : queueIndex
    set({ queue: newQueue, queueIndex: Math.min(newIndex, newQueue.length - 1) })
  },

  seek: (time) => {
    const { audioElement } = get()
    if (audioElement) {
      audioElement.currentTime = time
      set({ currentTime: time })
    }
  },

  setAudioElement: (el) => set({ audioElement: el }),
}))
