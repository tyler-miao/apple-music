'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CoverArt } from './CoverArt'
import { ProgressBar } from './ProgressBar'
import { PlayerControls } from './PlayerControls'
import { usePlayerStore } from '@/stores/playerStore'
import { useUIStore } from '@/stores/uiStore'

export function FloatingPlayerBar() {
  const { currentMusic } = usePlayerStore()
  const { toggleLyricsFullscreen } = useUIStore()
  const [isVisible, setIsVisible] = useState(false)
  const hideTimerRef = useRef<number | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    setIsVisible(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    hideTimerRef.current = window.setTimeout(() => setIsVisible(false), 500)
  }, [])

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{ height: '25vh' }}
      />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-4 pt-3"
            style={{
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-3">
              <button onClick={toggleLyricsFullscreen} className="flex items-center gap-2 flex-shrink-0">
                <div className="w-10 h-10">
                  <CoverArt />
                </div>
                <div className="text-left max-w-[120px]">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {currentMusic?.title || '未选择歌曲'}
                  </p>
                  <p className="text-[10px] text-white/50 truncate leading-tight mt-0.5">
                    {currentMusic?.artist || '搜索音乐开始播放'}
                  </p>
                </div>
              </button>

              <div className="flex-1 flex items-center gap-3">
                <ProgressBar />
              </div>

              <div className="scale-75 origin-right">
                <PlayerControls />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
