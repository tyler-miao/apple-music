'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '@/stores/playerStore'

export function CoverArt() {
  const { currentMusic, isPlaying } = usePlayerStore()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentMusic?.id || 'empty'}
        initial={{ opacity: 0, scale: 0.85, rotateZ: -5 }}
        animate={{
          opacity: 1,
          scale: 1,
          rotateZ: isPlaying ? 0 : 0,
          borderRadius: '12px',
        }}
        exit={{ opacity: 0, scale: 0.85, rotateZ: 5 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-14 h-14 rounded-xl overflow-hidden shadow-2xl flex-shrink-0"
      >
        {currentMusic?.coverUrl ? (
          <img
            src={currentMusic.coverUrl}
            alt={currentMusic.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-600 to-surface-800 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity="0.3">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
