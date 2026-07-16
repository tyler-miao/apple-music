import { create } from 'zustand'

export type AppView = 'mine' | 'player' | 'search' | 'playlists' | 'song' | 'admin' | 'mobile'

interface UIState {
  glassMode: number
  currentView: AppView
  isMobile: boolean
  coverColors: { vibrant: string; muted: string; dark: string; light: string }
  isLyricsFullscreen: boolean

  cycleGlassMode: () => void
  setCurrentView: (view: AppView) => void
  setMobile: (v: boolean) => void
  setCoverColors: (colors: UIState['coverColors']) => void
  setIsLyricsFullscreen: (v: boolean) => void
  toggleLyricsFullscreen: () => void
}

export const useUIStore = create<UIState>((set) => ({
  glassMode: 0,
  currentView: 'player',
  isMobile: false,
  coverColors: { vibrant: 'rgb(55,50,65)', muted: 'rgb(45,40,52)', dark: 'rgb(16,14,20)', light: 'rgb(50,46,58)' },
  isLyricsFullscreen: false,

  cycleGlassMode: () => set((s) => ({ glassMode: (s.glassMode + 1) % 3 })),
  setCurrentView: (view) => set({ currentView: view }),
  setMobile: (v) => set({ isMobile: v }),
  setCoverColors: (colors) => set({ coverColors: colors }),
  setIsLyricsFullscreen: (v) => set({ isLyricsFullscreen: v }),
  toggleLyricsFullscreen: () => set((s) => ({ isLyricsFullscreen: !s.isLyricsFullscreen })),
}))
