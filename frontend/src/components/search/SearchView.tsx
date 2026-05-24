'use client'

import { motion } from 'framer-motion'
import { SearchBar } from './SearchBar'
import { SearchResults } from './SearchResults'

export function SearchView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col flex-1 overflow-hidden pt-4"
    >
      <div className="px-6 pb-4">
        <SearchBar />
      </div>
      <SearchResults />
    </motion.div>
  )
}
