'use client'

import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { usePlayerStore } from '@/stores/playerStore'
import { formatTime } from '@/utils/format'

export function PlayerBar() {
  const { currentMusic, isPlaying, currentTime, duration, seek, togglePlay, nextTrack, prevTrack, volume, setVolume, toggleMute, isMuted, playbackMode, cyclePlaybackMode } = usePlayerStore()
  const barRef = useRef<HTMLDivElement>(null)
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleSeek = useCallback((e: React.MouseEvent) => {
    const bar = barRef.current
    if (!bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    seek(x * duration)
  }, [duration, seek])

  return (
    <div className="relative px-6 pb-1">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <span className="text-sm font-semibold text-white/80 truncate max-w-[120px]">{currentMusic?.title || '未选择歌曲'}</span>
          <span className="text-xs text-white/40 shrink-0">·</span>
          <span className="text-xs text-white/40 truncate max-w-[100px]">{currentMusic?.artist || '搜索音乐开始播放'}</span>
        </div>

        <div className="flex-1 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button onClick={prevTrack} className="p-1 text-white/40 hover:text-white/80 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
            </button>
            <motion.button onClick={togglePlay} whileTap={{ scale: 0.85 }}
              className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors">
              {isPlaying ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="5,3 19,12 5,21" /></svg>
              )}
            </motion.button>
            <button onClick={nextTrack} className="p-1 text-white/40 hover:text-white/80 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM4 18l8.5-6L4 6z" /></svg>
            </button>
          </div>

          <span className="text-[11px] text-white/40 tabular-nums">{formatTime(currentTime)}</span>

          <div ref={barRef} className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group relative overflow-hidden min-w-[80px]" onClick={handleSeek}>
            <div className="h-full bg-white rounded-full transition-[width] duration-75 relative" style={{ width: `${progress}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
            </div>
          </div>

          <span className="text-[11px] text-white/40 tabular-nums">{formatTime(duration)}</span>

          <button onClick={cyclePlaybackMode} className="p-1 text-white/30 hover:text-white/60 transition-colors" title={playbackMode === 'repeat' ? '单曲循环' : playbackMode === 'shuffle' ? '随机播放' : '顺序播放'}>
            {playbackMode === 'repeat' ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /><line x1="10" y1="16" x2="14" y2="16" /><path d="M10 11h4v5" /></svg>
            ) : playbackMode === 'shuffle' ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
            )}
          </button>

          <button onClick={toggleMute} className="p-1 text-white/30 hover:text-white/60 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMuted || volume === 0 ? (
                <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>
              ) : (
                <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></>
              )}
            </svg>
          </button>
          <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-14 h-1 appearance-none bg-white/10 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white/60 [&::-webkit-slider-thumb]:rounded-full" />
        </div>
      </div>
    </div>
  )
}
