'use client'

import { useRef, useState } from 'react'
import { useSearchStore } from '@/stores/searchStore'
import { gdService } from '@/services/gd-api.service'

export function SearchBar() {
  const { query, setQuery, setResults, setIsSearching, setSource, source, addRecentSearch } = useSearchStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [showSources, setShowSources] = useState(false)

  const sources = [
    { value: 'netease', label: '网易云' },
    { value: 'bilibili', label: 'B站' },
  ]

  const handleSearch = async (keyword: string) => {
    const q = keyword.trim()
    if (!q) return
    setIsSearching(true)
    addRecentSearch(q)
    try {
      const data = await gdService.search(q, source)
      setResults(
        data.map((item) => ({
          id: item.id,
          name: item.name,
          artist: item.artist,
          album: item.album,
          picId: item.pic_id,
          lyricId: item.lyric_id,
          source: item.source,
        }))
      )
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="relative flex items-center gap-3">
      <div className="relative flex-1 max-w-xl">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!e.target.value) setResults([])
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder="搜索音乐、歌手、专辑..."
          className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-4 py-3 text-white text-sm
            placeholder:text-white/25 outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all"
        />
      </div>

      <div className="relative">
        <button
          onClick={() => setShowSources(!showSources)}
          className="btn-glass px-3 py-2.5 rounded-full text-xs font-semibold text-white/60 hover:text-white"
        >
          {sources.find((s) => s.value === source)?.label || '来源'}
        </button>
        {showSources && (
          <div className="absolute top-full right-0 mt-2 glass rounded-2xl p-2 min-w-[140px] shadow-2xl z-50">
            {sources.map((s) => (
              <button
                key={s.value}
                onClick={() => { setSource(s.value); setShowSources(false) }}
                className={`block w-full text-left px-4 py-2 rounded-xl text-sm transition-colors ${
                  source === s.value ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
