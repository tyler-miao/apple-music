'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LyricLine } from './LyricLine'
import { useLyricStore } from '@/stores/lyricStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useUIStore } from '@/stores/uiStore'
import { useLyricsSync } from '@/hooks/useLyricsSync'
import { useInertiaScroll } from '@/hooks/useInertiaScroll'

export function LyricsContainer() {
  const { lyrics, currentLineIndex, isLoaded } = useLyricStore()
  const { currentMusic, seek } = usePlayerStore()
  const { isLyricsFullscreen } = useUIStore()

  useLyricsSync()
  const { containerRef: scrollRef, isFollowing } = useInertiaScroll()
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (isFollowing && currentLineIndex >= 0 && lineRefs.current[currentLineIndex]) {
      const el = lineRefs.current[currentLineIndex]
      const container = scrollRef.current
      if (!el || !container) return
      container.scrollTo({ top: el.offsetTop - container.clientHeight * 0.3 + el.clientHeight / 2, behavior: 'smooth' })
    }
  }, [currentLineIndex, isFollowing, scrollRef])

  return (
    <div className="flex-1 flex items-center overflow-hidden relative px-[8vw]" style={{ gap: '5vw' }}>
      <AnimatePresence>
        {currentMusic?.coverUrl && (
          <motion.div
            key="cover"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex items-center justify-end"
            style={{ flex: 1 }}
          >
            <div className="album-wrapper" style={{ maxWidth: '45vh', minWidth: 300, aspectRatio: 1 }}>
              <img
                src={currentMusic.coverUrl}
                alt={currentMusic.title}
                className="album-img"
                style={{ borderRadius: 24, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
              />
              <div
                className="album-overlay"
                style={{ borderRadius: 24 }}
                onClick={() => {
                  const s = usePlayerStore.getState()
                  s.isPlaying ? s.setIsPlaying(false) : s.setIsPlaying(true)
                }}
              >
                <div className="play-btn-glass">
                  <svg viewBox="0 0 24 24" style={{ width: 48, height: 48, fill: 'currentColor' }}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          paddingTop: isLyricsFullscreen ? '35vh' : '50vh',
          paddingBottom: isLyricsFullscreen ? '35vh' : '50vh',
        }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        ref={scrollRef}
        className="overflow-y-auto mask-fade no-scrollbar"
        style={{ flex: 1.2, height: '100%' }}
      >
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
      </motion.div>

      {!currentMusic?.coverUrl && (
        <motion.div
          key="cover-placeholder"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-end"
          style={{ flex: 1 }}
        >
          <div style={{ width: '45vh', minWidth: 300, aspectRatio: 1, borderRadius: 24, background: 'rgba(255,255,255,0.05)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
            className="flex items-center justify-center">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="white" opacity="0.15">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        </motion.div>
      )}
    </div>
  )
}
