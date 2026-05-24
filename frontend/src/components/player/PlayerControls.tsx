'use client'

import { motion } from 'framer-motion'
import { usePlayerStore } from '@/stores/playerStore'
import { clsx } from 'clsx'

export function PlayerControls() {
  const {
    isPlaying, togglePlay, nextTrack, prevTrack,
    playbackMode, cyclePlaybackMode, volume, setVolume, toggleMute, isMuted,
  } = usePlayerStore()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={cyclePlaybackMode}
        className={clsx(
          'p-2 rounded-full transition-colors',
          playbackMode !== 'sequential' ? 'text-white' : 'text-white/30 hover:text-white/60'
        )}
        title={playbackMode === 'repeat' ? '单曲循环' : playbackMode === 'shuffle' ? '随机播放' : '顺序播放'}
      >
        {playbackMode === 'repeat' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            <line x1="10" y1="16" x2="14" y2="16" /><path d="M10 11h4v5" />
          </svg>
        ) : playbackMode === 'shuffle' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        )}
      </button>

      <button
        onClick={prevTrack}
        className="p-2 text-white/60 hover:text-white transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      </button>

      <motion.button
        onClick={togglePlay}
        whileTap={{ scale: 0.9 }}
        className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        {isPlaying ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </motion.button>

      <button
        onClick={nextTrack}
        className="p-2 text-white/60 hover:text-white transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 6h2v12h-2zM4 18l8.5-6L4 6z" />
        </svg>
      </button>

      <div className="flex items-center gap-1.5 ml-1">
        <button onClick={toggleMute} className="p-1.5 text-white/40 hover:text-white/70 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isMuted || volume === 0 ? (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
              </>
            ) : volume < 0.5 ? (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </>
            ) : (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </>
            )}
          </svg>
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-20 h-1 appearance-none bg-white/10 rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
        />
      </div>
    </div>
  )
}
