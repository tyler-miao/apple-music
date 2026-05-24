'use client'

import { Suspense, useRef, useCallback } from 'react'
import { AmbientBackground } from '@/components/background/AmbientBackground'
import { TopBar } from '@/components/ui/TopBar'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { MineView } from '@/components/mine/MineView'
import { PlayerView } from '@/components/player/PlayerView'
import { PlayerBar } from '@/components/player/PlayerBar'
import { SearchPage } from '@/components/search/SearchPage'
import { PlaylistsView } from '@/components/playlist/PlaylistsView'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { useUIStore } from '@/stores/uiStore'

function MainContent() {
  useAudioPlayer()
  const { currentView } = useUIStore()

  const viewComponents: Record<string, JSX.Element> = {
    mine: <MineView />,
    player: <PlayerView />,
    search: <SearchPage />,
    playlists: <PlaylistsView />,
  }

  return (
    <div className="h-screen flex flex-col relative">
      <TopBar />
      {viewComponents[currentView] || <MineView />}
      <PlayerBar />
    </div>
  )
}

export default function Home() {
  const panelRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = panelRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const rotateX = (y - 0.5) * -4
    const rotateY = (x - 0.5) * 4
    el.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    const el = panelRef.current
    if (!el) return
    el.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)'
    el.style.transition = 'transform 0.6s ease-out'
    setTimeout(() => { if (el) el.style.transition = '' }, 600)
  }, [])

  return (
    <main className="h-screen bg-black text-white overflow-hidden">
      <AmbientBackground />
      <div
        ref={panelRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="h-full relative transition-[transform] duration-100 ease-out"
        style={{ zIndex: 10, transformStyle: 'preserve-3d' }}
      >
        <GlassPanel className="h-full relative" style={{ transformStyle: 'preserve-3d' }}>
          <Suspense fallback={null}>
            <MainContent />
          </Suspense>
        </GlassPanel>
      </div>
    </main>
  )
}
