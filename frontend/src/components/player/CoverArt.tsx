'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { StereoCover } from '@/components/player/StereoCover'
import { usePlayerStore } from '@/stores/playerStore'

export function CoverArt() {
  const { currentMusic } = usePlayerStore()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentMusic?.id || 'empty'}
        initial={{ opacity: 0, scale: 0.85, rotateZ: -5 }}
        animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
        exit={{ opacity: 0, scale: 0.85, rotateZ: 5 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-14 h-14 flex-shrink-0"
      >
        <StereoCover
          src={currentMusic?.coverUrl}
          alt={currentMusic?.title}
          size="100%"
          rounded="rounded-xl"
          tilt={false}
        />
      </motion.div>
    </AnimatePresence>
  )
}
