'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gdService } from '@/services/gd-api.service'
import { audioEngine } from '@/lib/audio-engine'
import { useSearchStore } from '@/stores/searchStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useLyricStore } from '@/stores/lyricStore'
import { useUIStore } from '@/stores/uiStore'
import { usePlaylistStore } from '@/stores/playlistStore'
import { LRCParser } from '@/lib/lrc-parser'
import { extractColorsFromImage } from '@/lib/color-thief'

const sources = [
  { value: 'netease', label: '网易云' },
  { value: 'bilibili', label: 'B站' },
]

export function SearchPage() {
  const { query, setQuery, results, setResults, setIsSearching, isSearching, source, setSource } = useSearchStore()
  const { setCurrentMusic, setIsPlaying } = usePlayerStore()
  const { setLyrics } = useLyricStore()
  const { setCoverColors } = useUIStore()
  const { playlists, addSongToPlaylist, createPlaylist } = usePlaylistStore()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [showSourceMenu, setShowSourceMenu] = useState(false)
  const [addToPlaylistId, setAddToPlaylistId] = useState<string | null>(null)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    fetch('/api/music/liked', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.ok ? r.json() : [])
      .then((songs: any[]) => setLikedIds(new Set(songs.map((s) => s.musicId))))
      .catch(() => {})
  }, [])

  const toggleLike = async (item: typeof results[0]) => {
    const musicId = `${item.source}-${item.id}`
    const token = localStorage.getItem('accessToken')
    if (!token) {
      useUIStore.getState().setCurrentView('mine')
      return
    }
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (next.has(musicId)) next.delete(musicId)
      else next.add(musicId)
      return next
    })
    try {
      await fetch(`/api/music/${musicId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: item.name,
          artist: item.artist.join(' / '),
          album: item.album,
          source: item.source,
          sourceId: item.id,
        }),
      })
    } catch {}
  }

  const handleSearch = async () => {
    const q = query.trim()
    if (!q) return
    setIsSearching(true)
    const data = await gdService.search(q, source, 30)
    setResults(data.map((item) => ({
      id: item.id, name: item.name, artist: item.artist, album: item.album,
      picId: item.pic_id, lyricId: item.lyric_id, source: item.source,
    })))
    setIsSearching(false)
  }

  const handlePlay = async (item: typeof results[0]) => {
    setLoadingId(item.id)
    audioEngine.ensureResumed()
    try {
      const audioUrl = await gdService.getUrl(item.id, item.source, 320)
      if (!audioUrl) return
      const queueSongs = results.map((r, i) => ({
        id: `${r.source}-${r.id}`, title: r.name, artist: r.artist.join(' / '),
        album: r.album, coverUrl: null, audioUrl: r.id === item.id ? audioUrl : null, duration: 0, playCount: 0,
        source: r.source, sourceId: r.id, picId: r.picId, lyricId: r.lyricId,
      }))
      const clickIdx = results.findIndex((r) => r.id === item.id)
      usePlayerStore.getState().setQueue(queueSongs, clickIdx >= 0 ? clickIdx : 0)
      const music = queueSongs[clickIdx >= 0 ? clickIdx : 0]
      setCurrentMusic(music)
      setIsPlaying(true)
      useUIStore.getState().setCurrentView('player')

      gdService.getPic(item.picId, item.source, 500).then((url) => {
        if (!url) return
        setCurrentMusic({ ...usePlayerStore.getState().currentMusic!, coverUrl: url })
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => setCoverColors(extractColorsFromImage(img))
        img.src = url
      })

      gdService.getLyric(item.lyricId, item.source).then((d) => {
        if (!d.lyric) return
        const c = d.tlyric ? d.lyric + '\n' + d.tlyric : d.lyric
        setLyrics(LRCParser.parse(c))
      })
    } catch (err) { console.error(err) }
    finally { setLoadingId(null) }
  }

  const handleAddToPlaylist = (song: typeof results[0]) => {
    const music = {
      id: `${song.source}-${song.id}`, title: song.name, artist: song.artist.join(' / '),
      album: song.album, coverUrl: null, audioUrl: null, duration: 0, playCount: 0,
      source: song.source, sourceId: song.id,
    }
    if (playlists.length === 0) {
      createPlaylist('我的歌单')
      setTimeout(() => addSongToPlaylist(usePlaylistStore.getState().playlists[0]?.id || '', music), 100)
    } else {
      setAddToPlaylistId(addToPlaylistId === `${song.source}-${song.id}` ? null : `${song.source}-${song.id}`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col overflow-hidden px-8 pt-6"
    >
      <div className="flex items-center gap-4 max-w-2xl mx-auto w-full mb-8">
        <div className="relative flex-1">
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索音乐、歌手、专辑..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-base placeholder:text-white/25 outline-none focus:bg-white/[0.08] focus:border-white/20 transition-all"
          />
        </div>
        <div className="relative">
          <button onClick={() => setShowSourceMenu(!showSourceMenu)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
            {sources.find((s) => s.value === source)?.label} ▾
          </button>
          {showSourceMenu && (
            <div className="absolute top-full right-0 mt-2 min-w-[140px] rounded-2xl p-2 z-50 shadow-2xl"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {sources.map((s) => (
                <button key={s.value} onClick={() => { setSource(s.value); setShowSourceMenu(false) }}
                  className={`block w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${source === s.value ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleSearch} disabled={!query.trim() || isSearching}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-30 border border-white/10 rounded-2xl px-6 py-4 text-sm font-semibold text-white transition-all">
          {isSearching ? '搜索中...' : '搜索'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar max-w-4xl mx-auto w-full">
        {!query ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/15 mb-6">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-white/30 text-lg font-medium">输入关键词开始搜索</p>
          </div>
        ) : isSearching ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-white/40 text-xl font-semibold">未找到 &ldquo;{query}&rdquo; 的结果</p>
            <p className="text-white/20 text-sm mt-2">试试更换音乐源或关键词</p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-white/30 font-medium uppercase tracking-widest mb-4 px-1">
              搜索结果 · {results.length} 首
            </p>
            <div className="space-y-1">
              {results.map((item, idx) => (
                <motion.div
                  key={`${item.source}-${item.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.25 }}
                  className="group flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/[0.06] cursor-pointer transition-all"
                >
                  <div onClick={() => handlePlay(item)} className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex-shrink-0 flex items-center justify-center">
                      {loadingId === item.id ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/30 group-hover:text-white/70 transition-colors">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                      <p className="text-xs text-white/40 truncate mt-0.5">{item.artist.join(' / ')} · {item.album}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/20 font-mono px-2 py-1 rounded-md bg-white/5 mr-1">{item.source}</span>
                  <button onClick={(e) => { e.stopPropagation(); toggleLike(item) }}
                    className="p-2 rounded-full transition-all mr-1">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={likedIds.has(`${item.source}-${item.id}`) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={likedIds.has(`${item.source}-${item.id}`) ? 'text-red-400 drop-shadow-sm' : 'text-white/30 hover:text-white/70'}>
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); handleAddToPlaylist(item) }}
                      className="p-2 rounded-full text-white/30 hover:text-white/70 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    {addToPlaylistId === `${item.source}-${item.id}` && (
                      <div className="absolute top-full right-0 mt-1 min-w-[160px] rounded-xl p-2 z-50 shadow-2xl"
                        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-[10px] text-white/40 px-2 pb-1">添加到歌单</p>
                        {playlists.map((pl) => (
                          <button key={pl.id} onClick={(e) => { e.stopPropagation(); const music = { id: `${item.source}-${item.id}`, title: item.name, artist: item.artist.join(' / '), album: item.album, coverUrl: null, audioUrl: null, duration: 0, playCount: 0, source: item.source, sourceId: item.id }; addSongToPlaylist(pl.id, music); setAddToPlaylistId(null) }}
                            className="block w-full text-left px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors truncate">
                            {pl.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
