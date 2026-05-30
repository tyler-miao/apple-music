'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LyricLine } from './LyricLine'
import { StereoCover } from '@/components/player/StereoCover'
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
            <div style={{ maxWidth: '45vh', minWidth: 300, width: '100%', aspectRatio: 1, position: 'relative' }}>
              <StereoCover
                src={currentMusic.coverUrl}
                alt={currentMusic.title}
                size="100%"
                rounded="rounded-3xl"
                tiltAmount={10}
              />
              <div
                className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center"
                style={{ borderRadius: 24 }}
                onClick={() => {
                  const s = usePlayerStore.getState()
                  s.isPlaying ? s.setIsPlaying(false) : s.setIsPlaying(true)
                }}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-xl opacity-0 hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <svg viewBox="0 0 24 24" style={{ width: 32, height: 32, fill: 'white', marginLeft: 3 }}>
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
          <div style={{ maxWidth: '45vh', minWidth: 300, width: '100%', aspectRatio: 1 }}>
            <StereoCover src={null} alt="" size="100%" rounded="rounded-3xl" tilt={false} />
          </div>
        </motion.div>
      )}
    </div>
  )
}
