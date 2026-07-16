'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '@/stores/playerStore'
import { useLyricStore } from '@/stores/lyricStore'
import { useLyricsSync } from '@/hooks/useLyricsSync'
import { LyricLine } from '@/components/lyrics/LyricLine'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function smoothScrollTo(container: HTMLElement, targetTop: number, duration = 400) {
  const start = container.scrollTop
  const diff = targetTop - start
  const startTime = performance.now()
  const ease = (t: number) => {
    const c = 1.70158
    return --t * t * ((c + 1) * t + c) + 1
  }
  const step = (now: number) => {
    const elapsed = now - startTime
    const p = Math.min(elapsed / duration, 1)
    container.scrollTop = start + diff * ease(p)
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export function MobileView() {
  const {
    currentMusic, isPlaying, currentTime, duration,
    togglePlay, nextTrack, prevTrack, seek,
  } = usePlayerStore()
  const { lyrics, currentLineIndex } = useLyricStore()
  const [dragging, setDragging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  const [coverLoaded, setCoverLoaded] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  useLyricsSync()

  useEffect(() => {
    setCoverLoaded(false)
  }, [currentMusic?.coverUrl])

  useEffect(() => {
    lineRefs.current = []
  }, [lyrics])

  useEffect(() => {
    if (currentLineIndex >= 0 && scrollRef.current && lineRefs.current[currentLineIndex]) {
      const el = lineRefs.current[currentLineIndex]
      const top = el.offsetTop - scrollRef.current.clientHeight * 0.35 + el.clientHeight / 2
      smoothScrollTo(scrollRef.current, top, 420)
    }
  }, [currentLineIndex])

  const handleLineClick = useCallback((time: number) => {
    seek(time)
  }, [seek])

  const handleBarTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    const bar = barRef.current
    if (!bar || !duration) return
    setDragging(true)
    const rect = bar.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width))
    setDragProgress(x * duration)
  }, [duration])

  const handleBarTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    const bar = barRef.current
    if (!bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width))
    setDragProgress(x * duration)
  }, [duration])

  const handleBarTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    setDragging(false)
    seek(dragProgress)
  }, [dragProgress, seek])

  const handleBarClick = useCallback((e: React.MouseEvent) => {
    const bar = barRef.current
    if (!bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    seek(x * duration)
  }, [duration, seek])

  const displayTime = dragging ? dragProgress : currentTime
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none"
      style={{ WebkitTapHighlightColor: 'transparent' }}>

      <div className="flex items-center gap-3 px-4 pt-[calc(var(--sat,0px)+12px)] pb-1 shrink-0 relative z-10">
        <div className="relative w-[54px] h-[54px] rounded-xl overflow-hidden shrink-0 shadow-lg">
          <AnimatePresence mode="wait">
            {currentMusic?.coverUrl ? (
              <motion.img
                key={currentMusic.id}
                src={currentMusic.coverUrl}
                alt={currentMusic.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: coverLoaded ? 1 : 0 }}
                onLoad={() => setCoverLoaded(true)}
                className="w-full h-full object-cover"
                style={{ transition: 'opacity 0.4s ease' }}
              />
            ) : (
              <div className="w-full h-full bg-white/10 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="opacity-25">
                  <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-white/90 truncate leading-tight">{currentMusic?.title || '未选择歌曲'}</p>
          <p className="text-[10px] text-white/40 mt-[1px] truncate">{currentMusic?.artist || 'Open Music'}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <motion.button
            onClick={prevTrack}
            whileTap={{ scale: 0.8 }}
            className="text-white/45 active:text-white/80 transition-colors p-0.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </motion.button>

          <motion.button
            onClick={togglePlay}
            whileTap={{ scale: 0.85 }}
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.85)' }}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="black">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="black" className="ml-0.5">
                <polygon points="8,5 19,12 8,19" />
              </svg>
            )}
          </motion.button>

          <motion.button
            onClick={nextTrack}
            whileTap={{ scale: 0.8 }}
            className="text-white/45 active:text-white/80 transition-colors p-0.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </motion.button>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-1 relative z-10">
        <div
          ref={barRef}
          className="relative h-[2px] bg-white/10 rounded-full cursor-pointer touch-none"
          onClick={handleBarClick}
          onTouchStart={handleBarTouchStart}
          onTouchMove={handleBarTouchMove}
          onTouchEnd={handleBarTouchEnd}
        >
          <div className="absolute left-0 top-0 h-full rounded-full bg-white/50"
            style={{ width: `${progress}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[7px] h-[7px] rounded-full bg-white/70"
            style={{ left: `${progress}%`, opacity: dragging ? 1 : 0 }} />
        </div>
        <div className="flex justify-between mt-[1px]">
          <span className="text-[8px] text-white/20 tabular-nums">{formatTime(displayTime)}</span>
          <span className="text-[8px] text-white/20 tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar mask-fade px-4 relative z-10"
      >
        {lyrics.length > 0 ? (
          <div className="flex flex-col min-h-full pt-[38vh] pb-[55vh]">
            {lyrics.map((line, idx) => (
              <div key={`${line.time}-${idx}`} ref={el => { lineRefs.current[idx] = el }} className="w-full flex justify-center">
                <div className="w-full max-w-[340px]">
                  <LyricLine
                    line={line}
                    isActive={idx === currentLineIndex}
                    index={idx}
                    onClick={() => seek(line.time)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-white/50 text-[15px] font-bold">
              {currentMusic ? '等待歌词...' : '选择一首歌'}
            </p>
            {currentMusic && (
              <p className="text-white/20 text-[12px]">正在加载歌词</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
