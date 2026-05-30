'use client'

import { useRef, useState, useEffect } from 'react'
import { useSearchStore } from '@/stores/searchStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useLyricStore } from '@/stores/lyricStore'
import { useUIStore } from '@/stores/uiStore'
import { gdService } from '@/services/gd-api.service'
import { audioEngine } from '@/lib/audio-engine'
import { LRCParser } from '@/lib/lrc-parser'
import { extractColorsFromImage } from '@/lib/color-thief'

export function InlineSearch() {
  const { query, setQuery, results, setResults, setIsSearching, isSearching, source, setSource } = useSearchStore()
  const { setCurrentMusic, setIsPlaying } = usePlayerStore()
  const { setLyrics } = useLyricStore()
  const { setCoverColors } = useUIStore()
  const [showPanel, setShowPanel] = useState(false)
  const timerRef = useRef<number | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && e.target !== inputRef.current) {
        setShowPanel(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const handleInput = (value: string) => {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!value.trim()) { setResults([]); setShowPanel(false); return }
    timerRef.current = window.setTimeout(async () => {
      setIsSearching(true)
      setShowPanel(true)
      const data = await gdService.search(value, source)
      setResults(data.map(i => ({ id: i.id, name: i.name, artist: i.artist, album: i.album, picId: i.pic_id, lyricId: i.lyric_id, source: i.source })))
      setIsSearching(false)
    }, 350)
  }

  const handlePlay = async (item: typeof results[0]) => {
    setShowPanel(false)
    inputRef.current?.blur()
    audioEngine.ensureResumed()
    try {
      const audioUrl = await gdService.getUrl(item.id, item.source, 320)
      if (!audioUrl) return
      setCurrentMusic({
        id: `${item.source}-${item.id}`, title: item.name, artist: item.artist.join(' / '),
        album: item.album, coverUrl: null, audioUrl, duration: 0, playCount: 0,
        source: item.source, sourceId: item.id, picId: item.picId, lyricId: item.lyricId,
      })
      setIsPlaying(true)

      gdService.getPic(item.picId, item.source, 500).then(url => {
        if (!url) return
        setCurrentMusic({ ...usePlayerStore.getState().currentMusic!, coverUrl: url })
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => setCoverColors(extractColorsFromImage(img))
        img.src = url
      })

      gdService.getLyric(item.lyricId, item.source).then(d => {
        if (!d.lyric) return
        const c = d.tlyric ? d.lyric + '\n' + d.tlyric : d.lyric
        setLyrics(LRCParser.parse(c))
      })
    } catch (err) { console.error(err) }
  }

  return (
    <div className="relative z-30 pt-3 px-6">
      <div className="flex items-center gap-2 max-w-lg">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder="搜索音乐..."
            className="w-full bg-white/[0.06] border border-white/[0.06] rounded-full pl-8 pr-3 py-2 text-sm text-white/80 placeholder:text-white/25 outline-none focus:bg-white/[0.1] focus:border-white/10 transition-all"
          />
        </div>
        <select
          value={source}
          onChange={e => setSource(e.target.value)}
          className="bg-white/[0.06] border border-white/[0.06] rounded-full px-3 py-2 text-xs text-white/50 outline-none cursor-pointer"
        >
          <option value="netease">网易</option>
          <option value="bilibili">B站</option>
        </select>
      </div>

      {showPanel && (
        <div ref={panelRef} className="absolute top-full left-6 right-6 mt-2 max-h-[40vh] overflow-y-auto rounded-2xl border border-white/[0.06] z-50"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}>
          {isSearching ? (
            <div className="text-center py-8 text-white/30 text-sm">搜索中...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">无结果</div>
          ) : results.map((item, i) => (
            <div key={i} onClick={() => handlePlay(item)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.06] transition-colors rounded-xl mx-1">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white/90 truncate">{item.name}</p>
                <p className="text-xs text-white/40 truncate">{item.artist.join(' / ')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
