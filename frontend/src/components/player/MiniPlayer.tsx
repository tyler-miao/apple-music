'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '@/stores/playerStore'
import { useUIStore } from '@/stores/uiStore'
import { formatTime } from '@/utils/format'
import { hapticMedium, hapticSelection } from '@/utils/haptic'
import { CoverArt } from './CoverArt'

export function MiniPlayer() {
  const {
    currentMusic, isPlaying, togglePlay, currentTime, duration, seek,
    nextTrack, prevTrack, volume, setVolume, isMuted, toggleMute, playbackMode, cyclePlaybackMode,
  } = usePlayerStore()
  const { isLyricsFullscreen, toggleLyricsFullscreen, coverColors } = useUIStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [playerHeight, setPlayerHeight] = useState(800)
  const [swipeX, setSwipeX] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwiping = useRef(false)

  useEffect(() => { setPlayerHeight(window.innerHeight) }, [])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Touch handling for swipe up/down + left/right
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwiping.current = false
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    if (!isSwiping.current) {
      isSwiping.current = Math.abs(dx) > 10 || Math.abs(dy) > 10
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      setSwipeX(dx)
    } else if (!isExpanded) {
      setDragY(Math.max(0, dy))
    }
  }, [isExpanded])

  const onTouchEnd = useCallback(() => {
    if (Math.abs(swipeX) > 80) {
      hapticSelection()
      if (swipeX < 0) nextTrack()
      else prevTrack()
    }
    setSwipeX(0)
    if (dragY > 100) setIsExpanded(false)
    setDragY(0)
  }, [swipeX, dragY, nextTrack, prevTrack])

  const handleDragEnd = useCallback((_: any, info: any) => {
    if (info.offset.y < -100) { hapticMedium(); setIsExpanded(true) }
    else if (info.offset.y > 100) { setIsExpanded(false) }
    setDragY(0)
  }, [])

  return (
    <>
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        animate={isExpanded ? { y: -(playerHeight - 120) } : { y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 touch-none select-none"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Mini bar */}
        <div className="px-4 py-2.5 flex items-center gap-3" style={{ transform: `translateX(${swipeX}px)` }}>
          <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
            {currentMusic?.coverUrl ? (
              <img src={currentMusic.coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" opacity="0.2"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">{currentMusic?.title || '未播放'}</p>
            <p className="text-[11px] text-white/40 truncate leading-tight mt-0.5">{currentMusic?.artist || ''}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); togglePlay(); hapticSelection() }}
            className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white transition-colors flex-shrink-0">
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="5,3 19,12 5,21"/></svg>
            )}
          </button>
        </div>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/8"><div className="h-full bg-white transition-[width] duration-100" style={{ width: `${progress}%` }}/></div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 flex flex-col touch-none select-none"
            style={{
              paddingTop: 'env(safe-area-inset-top, 20px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              background: `linear-gradient(180deg, ${coverColors.vibrant}44 0%, #000 55%)`,
              backdropFilter: 'blur(60px) saturate(250%)',
              WebkitBackdropFilter: 'blur(60px) saturate(250%)',
            }}
          >
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/30 cursor-pointer" onClick={() => setIsExpanded(false)}/></div>
            <div className="flex justify-center pb-1"><button onClick={() => setIsExpanded(false)} className="text-[10px] text-white/25 tracking-[0.2em] uppercase">向下关闭</button></div>
            <div className="flex-1 flex items-center justify-center px-10">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                className="w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden shadow-2xl"
                style={{ boxShadow: `0 30px 80px ${coverColors.vibrant}33` }}
              >
                {currentMusic?.coverUrl ? (
                  <img src={currentMusic.coverUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="white" opacity="0.15"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                  </div>
                )}
              </motion.div>
            </div>
            <div className="px-8 pt-4 pb-1">
              <p className="text-xl font-bold text-white truncate">{currentMusic?.title || '未播放'}</p>
              <p className="text-sm text-white/50 truncate mt-0.5">{currentMusic?.artist || ''}</p>
            </div>
            <div className="px-8 pt-3">
              <div className="w-full h-1 bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
                onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * duration) }}>
                <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }}/>
              </div>
              <div className="flex justify-between mt-1.5"><span className="text-[10px] text-white/35 tabular-nums">{formatTime(currentTime)}</span><span className="text-[10px] text-white/35 tabular-nums">{formatTime(duration)}</span></div>
            </div>
            <div className="flex items-center justify-center gap-8 px-8 py-4">
              <button onClick={()=>{prevTrack();hapticSelection()}} className="text-white/60 hover:text-white p-2 transition-colors"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
              <button onClick={()=>{togglePlay();hapticMedium()}} className="w-16 h-16 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                {isPlaying ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5,3 19,12 5,21"/></svg>
                )}
              </button>
              <button onClick={()=>{nextTrack();hapticSelection()}} className="text-white/60 hover:text-white p-2 transition-colors"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM4 18l8.5-6L4 6z"/></svg></button>
            </div>
            <div className="flex items-center justify-center gap-6 px-8 pb-4">
              <button onClick={()=>{cyclePlaybackMode();hapticSelection()}} className="text-[10px] text-white/40 hover:text-white/80 transition-colors px-3 py-1.5 rounded-full border border-white/10">
                {playbackMode === 'repeat' ? '单曲循环' : playbackMode === 'shuffle' ? '随机' : '顺序'}
              </button>
              <button onClick={()=>{toggleMute();hapticSelection()}} className="text-white/40 hover:text-white/80 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isMuted || volume === 0 ? (
                    <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
                  ) : (
                    <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>
                  )}
                </svg>
              </button>
              <button onClick={()=>{toggleLyricsFullscreen();hapticSelection()}} className="text-[10px] text-white/40 hover:text-white/80 transition-colors px-3 py-1.5 rounded-full border border-white/10">
                {isLyricsFullscreen ? '关闭歌词' : '歌词'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
