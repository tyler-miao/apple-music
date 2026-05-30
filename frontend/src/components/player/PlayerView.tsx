'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LyricLine } from '@/components/lyrics/LyricLine'
import { StereoCover } from '@/components/player/StereoCover'
import { useLyricStore } from '@/stores/lyricStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useLyricsSync } from '@/hooks/useLyricsSync'
import { useInertiaScroll } from '@/hooks/useInertiaScroll'

interface HeartParticle {
  id: number
  x: number
  y: number
  size: number
  delay: number
}

export function PlayerView() {
  const { lyrics, currentLineIndex, isLoaded } = useLyricStore()
  const { currentMusic, seek, isPlaying } = usePlayerStore()
  const [hearts, setHearts] = useState<HeartParticle[]>([])
  const [shaking, setShaking] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const heartIdRef = useRef(0)

  useLyricsSync()
  const { containerRef: scrollRef, isFollowing } = useInertiaScroll()
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const id = currentMusic?.id
    if (!id) { setIsLiked(false); return }
    const token = localStorage.getItem('accessToken')
    if (!token) return
    fetch('/api/music/liked', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.ok ? r.json() : [])
      .then((songs: any[]) => setIsLiked(songs.some((s) => s.musicId === id)))
      .catch(() => {})
  }, [currentMusic?.id])

  const burstHearts = useCallback((clientX: number, clientY: number) => {
    const newHearts: HeartParticle[] = Array.from({ length: 12 }, () => ({
      id: heartIdRef.current++,
      x: clientX,
      y: clientY,
      size: 16 + Math.random() * 20,
      delay: Math.random() * 0.15,
    }))
    setHearts((prev) => [...prev, ...newHearts])
    setTimeout(() => setHearts((prev) => prev.filter((h) => !newHearts.find((n) => n.id === h.id))), 1200)
  }, [])

  const toggleLike = useCallback(async () => {
    const id = currentMusic?.id
    if (!id) return
    const token = localStorage.getItem('accessToken')
    if (!token) return
    try {
      const res = await fetch(`/api/music/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: currentMusic?.title,
          artist: currentMusic?.artist,
          album: currentMusic?.album,
          source: currentMusic?.source,
          sourceId: currentMusic?.sourceId,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setIsLiked(data.liked)
      }
    } catch {}
  }, [currentMusic])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    burstHearts(e.clientX, e.clientY)
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
    toggleLike()
  }, [burstHearts, toggleLike])

  const handleCoverClick = useCallback(() => {
    const s = usePlayerStore.getState()
    s.isPlaying ? s.setIsPlaying(false) : s.setIsPlaying(true)
    if (s.currentMusic) useHistoryStore.getState().addEntry(s.currentMusic)
  }, [])



  useEffect(() => {
    if (currentLineIndex >= 0 && lineRefs.current[currentLineIndex]) {
      const el = lineRefs.current[currentLineIndex]
      const container = scrollRef.current
      if (!el || !container) return
      container.scrollTo({ top: el.offsetTop - container.clientHeight * 0.3 + el.clientHeight / 2, behavior: 'smooth' })
    }
  }, [currentLineIndex, scrollRef])

  return (
    <div
      className={`flex-1 flex items-center overflow-hidden relative px-[6vw] gap-16 ${shaking ? 'animate-shake' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          initial={{ opacity: 1, scale: 0, x: h.x, y: h.y }}
          animate={{
            opacity: 0,
            scale: 1.5,
            x: h.x + (Math.random() - 0.5) * 200,
            y: h.y - 80 - Math.random() * 120,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, delay: h.delay, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed pointer-events-none z-50"
          style={{ width: h.size, height: h.size }}
        >
          <svg viewBox="0 0 24 24" fill="#ff4d6d" className="w-full h-full drop-shadow-lg">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </motion.div>
      ))}

      <div ref={scrollRef} className="overflow-y-auto mask-fade no-scrollbar" style={{ flex: 1.2, height: '100%' }}>
        <AnimatePresence mode="wait">
          {!isLoaded || lyrics.length === 0 ? (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full gap-4 text-center"
            >
              <div className="font-extrabold tracking-tight text-white/80" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
                {currentMusic ? '等待歌词...' : 'Apple Music Experience'}
              </div>
              <div className="font-semibold text-white/40" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.4rem)' }}>
                {currentMusic ? '正在加载歌词' : '搜索音乐开始体验'}
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col min-h-full justify-center">
              {lyrics.map((line, idx) => (
                <div key={`${line.time}-${idx}`} ref={(el) => { lineRefs.current[idx] = el }}>
                  <LyricLine
                    line={line}
                    isActive={idx === currentLineIndex}
                    index={idx}
                    onClick={() => seek(line.time)}
                  />
                </div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentMusic?.id || 'cover'}
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex items-center justify-end relative"
          style={{ flex: 1 }}
        >
          <div
            style={{
              maxWidth: '45vh',
              minWidth: 300,
              aspectRatio: 1,
              width: '100%',
              position: 'relative',
            }}
          >
            <StereoCover
              src={currentMusic?.coverUrl}
              alt={currentMusic?.title}
              size="100%"
              rounded="rounded-3xl"
              tiltAmount={10}
              onClick={handleCoverClick}
            />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: isLiked ? 1 : 0 }}
              className="absolute top-5 right-5 w-9 h-9 rounded-full backdrop-blur-xl flex items-center justify-center z-10"
              style={{ background: 'rgba(0,0,0,0.4)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? '#ff4d6d' : 'none'} stroke={isLiked ? '#ff4d6d' : 'white'} strokeWidth="2" className={isLiked ? '' : 'text-white/70'}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
