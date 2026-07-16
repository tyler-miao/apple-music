'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlaylistStore } from '@/stores/playlistStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useLyricStore } from '@/stores/lyricStore'
import { useUIStore } from '@/stores/uiStore'
import { useHistoryStore } from '@/stores/historyStore'
import { gdService, GDSearchItem } from '@/services/gd-api.service'
import { audioEngine } from '@/lib/audio-engine'
import { LRCParser } from '@/lib/lrc-parser'
import { extractColorsFromImage } from '@/lib/color-thief'

const importSources = [
  { value: 'netease', label: '网易云' },
  { value: 'bilibili', label: 'B站' },
]

export function PlaylistsView() {
  const { playlists, createPlaylist, deletePlaylist, renamePlaylist, removeSongFromPlaylist, addSongToPlaylist, importFromSource } = usePlaylistStore()
  const { setCurrentMusic, setIsPlaying } = usePlayerStore()
  const { setLyrics } = useLyricStore()
  const { setCoverColors, setCurrentView } = useUIStore()
  const { addEntry } = useHistoryStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchSource, setSearchSource] = useState('netease')
  const [showSearchSource, setShowSearchSource] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set())
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null)
  const [targetPlaylistId, setTargetPlaylistId] = useState<string | null>(null)
  const [showTargetPicker, setShowTargetPicker] = useState(false)

  const [shareUrl, setShareUrl] = useState('')
  const [fetchingPlaylist, setFetchingPlaylist] = useState(false)
  const [fetchedTracks, setFetchedTracks] = useState<any[]>([])
  const [fetchedPlaylistName, setFetchedPlaylistName] = useState('')
  const [selectedFetched, setSelectedFetched] = useState<Set<string>>(new Set())
  const [showSharePanel, setShowSharePanel] = useState(false)
  const [coverCache, setCoverCache] = useState<Record<string, string>>({})

  const loadCoversForPlaylist = async (songs: any[]) => {
    const toFetch = songs.filter((s) => s.picId && !coverCache[s.id])
    if (toFetch.length === 0) return
    const results = await Promise.allSettled(
      toFetch.map((s) => gdService.getPic(s.picId, s.source || 'netease', 200).then((url) => ({ id: s.id, url })))
    )
    const updates: Record<string, string> = {}
    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value.url) updates[r.value.id] = r.value.url
    })
    if (Object.keys(updates).length > 0) setCoverCache((prev) => ({ ...prev, ...updates }))
  }

  useEffect(() => {
    if (!expandedId) return
    const pl = playlists.find((p) => p.id === expandedId)
    if (pl) loadCoversForPlaylist(pl.songs)
  }, [expandedId])

  const handlePlayAll = (songs: any[]) => {
    if (songs.length === 0) return
    audioEngine.ensureResumed()
    const first = songs[0]
    const source = first.source || 'netease'
    const sourceId = first.sourceId || first.id.replace(/^[^-]+-/, '')
    usePlayerStore.getState().setQueue(songs, 0)
    setCurrentView('player')
    const playFirst = async () => {
      const source = first.source || 'netease'
      const sourceId = first.sourceId || first.id.replace(/^[^-]+-/, '')
      const [audioUrl, coverUrl] = await Promise.all([
        gdService.getUrl(sourceId, source, 320),
        gdService.getPic(first.picId || '', source, 500),
      ])
      if (!audioUrl) return
      const updated = { ...first, audioUrl, coverUrl }
      usePlayerStore.getState().setCurrentMusic(updated)
      usePlayerStore.getState().setIsPlaying(true)
      addEntry(updated)
      if (coverUrl) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => { try { setCoverColors(extractColorsFromImage(img)) } catch {} }
        img.onerror = () => {}
        img.src = coverUrl
      }
      gdService.getLyric(first.lyricId || sourceId, source).then((d) => {
        if (!d.lyric) return
        const c = d.tlyric ? d.lyric + '\n' + d.tlyric : d.lyric
        setLyrics(LRCParser.parse(c))
      })
    }
    playFirst()
  }

  const handleCreate = () => {
    if (!newName.trim()) return
    createPlaylist(newName.trim(), newDesc.trim())
    setNewName(''); setNewDesc(''); setShowCreate(false)
  }

  const handleRename = (id: string) => {
    if (!editName.trim()) return
    renamePlaylist(id, editName.trim())
    setEditingId(null)
  }

  const handlePlaySong = async (music: any, playlistSongs?: any[]) => {
    setLoadingSongId(music.id)
    audioEngine.ensureResumed()
    try {
      const source = music.source || 'netease'
      const sourceId = music.sourceId || music.id.replace(/^[^-]+-/, '')
      const [audioUrl, coverUrl] = await Promise.all([
        gdService.getUrl(sourceId, source, 320),
        gdService.getPic(music.picId || '', source, 500),
      ])
      if (!audioUrl) return
      const updated = { ...music, audioUrl, coverUrl }
      if (playlistSongs && playlistSongs.length > 0) {
        const idx = playlistSongs.findIndex((s) => s.id === music.id)
        usePlayerStore.getState().setQueue(playlistSongs, idx >= 0 ? idx : 0)
      }
      setCurrentMusic(updated)
      setIsPlaying(true)
      addEntry(updated)
      setCurrentView('player')

      if (coverUrl) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => { try { setCoverColors(extractColorsFromImage(img)) } catch {} }
        img.onerror = () => {}
        img.src = coverUrl
      }

      gdService.getLyric(music.lyricId || sourceId, source).then((d) => {
        if (!d.lyric) return
        const c = d.tlyric ? d.lyric + '\n' + d.tlyric : d.lyric
        setLyrics(LRCParser.parse(c))
      })
    } catch (err) { console.error(err) }
    finally { setLoadingSongId(null) }
  }

  const handleSearch = async () => {
    const q = searchKeyword.trim()
    if (!q) return
    setSearching(true)
    setSearchResults([])
    setSelectedSongs(new Set())
    try {
      const data = await gdService.search(q, searchSource, 30)
      setSearchResults(data.map((item: GDSearchItem) => ({
        id: `${item.source}-${item.id}`, title: item.name, artist: item.artist.join(' / '),
        album: item.album, source: item.source, sourceId: item.id, picId: item.pic_id, lyricId: item.lyric_id,
      })))
    } catch (err) { console.error(err) }
    finally { setSearching(false) }
  }

  const toggleSelectSong = (id: string, set: Set<string>, setter: (s: Set<string>) => void) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setter(next)
  }

  const handleImportResults = () => {
    if (selectedSongs.size === 0) return
    const songs = searchResults.filter((s) => selectedSongs.has(s.id))
    if (targetPlaylistId) {
      songs.forEach((s) => addSongToPlaylist(targetPlaylistId, s))
      setExpandedId(targetPlaylistId)
    } else {
      const newId = importFromSource(searchKeyword.trim(), songs, searchSource)
      if (newId) setExpandedId(newId)
    }
    setTimeout(() => loadCoversForPlaylist(songs), 100)
    setSearchResults([])
    setSelectedSongs(new Set())
    setShowImportPanel(false)
    setTargetPlaylistId(null)
  }

  const handleFetchPlaylist = async () => {
    const url = shareUrl.trim()
    if (!url) return
    setFetchingPlaylist(true)
    setFetchedTracks([])
    setFetchedPlaylistName('')
    setSelectedFetched(new Set())
    try {
      const res = await fetch(`/api/playlist/fetch?url=${encodeURIComponent(url)}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '获取歌单失败')
      }
      const data = await res.json()
      setFetchedPlaylistName(data.name || '未命名歌单')
      setFetchedTracks(data.tracks || [])
      setSelectedFetched(new Set((data.tracks || []).map((t: any) => t.id)))
    } catch (err: any) {
      console.error(err)
      alert(err.message || '获取歌单失败，请检查链接是否正确')
    }
    finally { setFetchingPlaylist(false) }
  }

  const handleImportFetched = () => {
    if (selectedFetched.size === 0) return
    const songs = fetchedTracks.filter((s) => selectedFetched.has(s.id))
    const name = fetchedPlaylistName || shareUrl.trim()
    const newId = importFromSource(name, songs, 'netease')
    if (newId) {
      setExpandedId(newId)
      setTimeout(() => loadCoversForPlaylist(songs), 100)
    }
    setFetchedTracks([])
    setFetchedPlaylistName('')
    setSelectedFetched(new Set())
    setShareUrl('')
    setShowSharePanel(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar px-8 pt-6 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white/90">我的歌单</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => { setShowSharePanel(!showSharePanel); setShowImportPanel(false); setShowCreate(false) }}
                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /><polyline points="7 11 12 16 17 11" /><line x1="12" y1="4" x2="12" y2="16" />
                </svg>
                分享链接导入
              </button>
              <button onClick={() => { setShowImportPanel(!showImportPanel); setShowSharePanel(false); setShowCreate(false) }}
                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                搜索导入
              </button>
              <button onClick={() => { setShowCreate(!showCreate); setShowImportPanel(false); setShowSharePanel(false) }}
                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                新建歌单
              </button>
            </div>
          </div>

          {showSharePanel && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-5 rounded-2xl border border-white/10"
              style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}>
              <h3 className="text-sm font-semibold text-white/60 mb-2">通过分享链接导入歌单</h3>
              <p className="text-xs text-white/30 mb-4">支持网易云音乐、QQ音乐歌单链接，也支持直接输入歌单 ID</p>
              <div className="flex items-center gap-3">
                <input value={shareUrl} onChange={(e) => setShareUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchPlaylist()}
                  placeholder="粘贴歌单分享链接或歌单 ID..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-white/20 placeholder:text-white/25" />
                <button onClick={handleFetchPlaylist} disabled={fetchingPlaylist || !shareUrl.trim()}
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-30 border border-white/10 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all">
                  {fetchingPlaylist ? '获取中...' : '获取歌单'}
                </button>
              </div>

              {fetchingPlaylist && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}

              {fetchedTracks.length > 0 && (
                <div className="border-t border-white/10 pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white/80">{fetchedPlaylistName}</p>
                    <span className="text-xs text-white/40">{fetchedTracks.length} 首歌曲</span>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-0.5 mb-3">
                    {fetchedTracks.map((item: any) => (
                      <div key={item.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${selectedFetched.has(item.id) ? 'bg-white/10' : 'hover:bg-white/[0.04]'}`}
                        onClick={() => toggleSelectSong(item.id, selectedFetched, setSelectedFetched)}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedFetched.has(item.id) ? 'bg-white border-white' : 'border-white/20'}`}>
                          {selectedFetched.has(item.id) && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="black"><polyline points="20 6 9 17 4 12" stroke="black" strokeWidth="3" fill="none" /></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-sm text-white/80 truncate">{item.title}</span>
                          <span className="text-xs text-white/40 shrink-0">·</span>
                          <span className="text-xs text-white/40 truncate">{item.artist}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        if (selectedFetched.size === fetchedTracks.length) setSelectedFetched(new Set())
                        else setSelectedFetched(new Set(fetchedTracks.map((s: any) => s.id)))
                      }} className="text-xs text-white/40 hover:text-white/60 transition-colors">
                        {selectedFetched.size === fetchedTracks.length ? '取消全选' : `全选 (${fetchedTracks.length})`}
                      </button>
                      <span className="text-xs text-white/30">已选 {selectedFetched.size} 首</span>
                    </div>
                    <button onClick={handleImportFetched} disabled={selectedFetched.size === 0}
                      className="bg-white/15 hover:bg-white/25 disabled:opacity-30 px-5 py-1.5 rounded-xl text-xs font-semibold text-white transition-all">
                      导入 {selectedFetched.size > 0 ? `${selectedFetched.size} 首` : ''}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {showImportPanel && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-5 rounded-2xl border border-white/10"
              style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}>
              <h3 className="text-sm font-semibold text-white/60 mb-3">搜索音乐导入歌单</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <button onClick={() => setShowSearchSource(!showSearchSource)}
                    className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all min-w-[88px] text-left flex items-center justify-between gap-2">
                    {importSources.find((s) => s.value === searchSource)?.label} ▾
                  </button>
                  {showSearchSource && (
                    <div className="absolute bottom-full left-0 mb-1 min-w-[130px] rounded-2xl p-2 z-50 shadow-2xl"
                      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {importSources.map((s) => (
                        <button key={s.value} onClick={() => { setSearchSource(s.value); setShowSearchSource(false) }}
                          className={`block w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${searchSource === s.value ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="输入关键词搜索歌曲..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-white/20 placeholder:text-white/25" />
                <button onClick={handleSearch} disabled={searching || !searchKeyword.trim()}
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-30 border border-white/10 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all">
                  {searching ? '搜索中...' : '搜索'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                  <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-0.5 mb-3">
                    {searchResults.map((item, idx) => (
                      <div key={item.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${selectedSongs.has(item.id) ? 'bg-white/10' : 'hover:bg-white/[0.04]'}`}
                        onClick={() => toggleSelectSong(item.id, selectedSongs, setSelectedSongs)}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedSongs.has(item.id) ? 'bg-white border-white' : 'border-white/20'}`}>
                          {selectedSongs.has(item.id) && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="black"><polyline points="20 6 9 17 4 12" stroke="black" strokeWidth="3" fill="none" /></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-sm text-white/80 truncate">{item.title}</span>
                          <span className="text-xs text-white/40 shrink-0">·</span>
                          <span className="text-xs text-white/40 truncate">{item.artist}</span>
                        </div>
                        <span className="text-[10px] text-white/20 font-mono px-1.5 py-0.5 rounded bg-white/5">{item.source}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        if (selectedSongs.size === searchResults.length) setSelectedSongs(new Set())
                        else setSelectedSongs(new Set(searchResults.map((s) => s.id)))
                      }} className="text-xs text-white/40 hover:text-white/60 transition-colors">
                        {selectedSongs.size === searchResults.length ? '取消全选' : `全选 (${searchResults.length})`}
                      </button>
                      <span className="text-xs text-white/30">已选 {selectedSongs.size} 首</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button onClick={() => setShowTargetPicker(!showTargetPicker)}
                          className="text-xs text-white/60 hover:text-white/80 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 transition-colors">
                          {targetPlaylistId ? `添加到: ${playlists.find(p => p.id === targetPlaylistId)?.name || ''}` : '导入为新歌单'}
                        </button>
                        {showTargetPicker && (
                          <div className="absolute bottom-full right-0 mb-1 min-w-[160px] rounded-2xl p-2 z-50 shadow-2xl"
                            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <button onClick={() => { setTargetPlaylistId(null); setShowTargetPicker(false) }}
                              className={`block w-full text-left px-4 py-2.5 rounded-xl text-xs transition-colors ${!targetPlaylistId ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                              导入为新歌单
                            </button>
                            {playlists.length > 0 && <div className="border-t border-white/5 my-1" />}
                            {playlists.map((pl) => (
                              <button key={pl.id} onClick={() => { setTargetPlaylistId(pl.id); setShowTargetPicker(false) }}
                                className={`block w-full text-left px-4 py-2.5 rounded-xl text-xs transition-colors ${targetPlaylistId === pl.id ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                                {pl.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={handleImportResults} disabled={selectedSongs.size === 0}
                        className="bg-white/15 hover:bg-white/25 disabled:opacity-30 px-5 py-1.5 rounded-xl text-xs font-semibold text-white transition-all">
                        导入 {selectedSongs.size > 0 ? `${selectedSongs.size} 首` : ''}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {searching && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}

              {!searching && searchKeyword && searchResults.length === 0 && (
                <p className="text-white/30 text-xs text-center py-4">未找到结果，试试更换关键词或音乐源</p>
              )}
            </motion.div>
          )}

          {showCreate && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-5 rounded-2xl border border-white/10"
              style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="歌单名称" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-white/20 mb-3 placeholder:text-white/25" />
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="描述（可选）"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-white/20 mb-3 placeholder:text-white/25" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white">取消</button>
                <button onClick={handleCreate} className="bg-white/15 hover:bg-white/25 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all">创建</button>
              </div>
            </motion.div>
          )}

          {playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/15 mb-4">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
              <p className="text-white/30 text-sm">还没有歌单，点击上方新建或从平台导入</p>
            </div>
          ) : (
            <div className="space-y-3">
              {playlists.map((pl) => (
                <motion.div key={pl.id} layout className="rounded-2xl border border-white/10 overflow-hidden transition-all"
                  style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(15px)' }}>
                  <div onClick={() => setExpandedId(expandedId === pl.id ? null : pl.id)}
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="white" opacity="0.3">
                          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        {editingId === pl.id ? (
                          <input value={editName} onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(pl.id)}
                            onBlur={() => handleRename(pl.id)}
                            className="bg-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none"
                            autoFocus onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <p className="text-sm font-semibold text-white truncate">{pl.name}</p>
                        )}
                        <p className="text-xs text-white/40 mt-0.5">{pl.songs.length} 首歌曲</p>
                      </div>
                      {pl.songs.length > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); handlePlayAll(pl.songs) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-xs font-semibold text-white/70 hover:text-white mr-2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                          播放全部
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setEditingId(pl.id); setEditName(pl.name) }}
                        className="p-2 rounded-full text-white/30 hover:text-white/60 hover:bg-white/10 transition-all">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button onClick={() => { if (confirm('确定删除此歌单？')) deletePlaylist(pl.id) }}
                        className="p-2 rounded-full text-white/30 hover:text-red-400 hover:bg-white/10 transition-all">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`text-white/30 transition-transform ${expandedId === pl.id ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === pl.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <div className="border-t border-white/5 px-2 py-2 max-h-[40vh] overflow-y-auto no-scrollbar">
                          {pl.songs.length === 0 ? (
                            <p className="text-white/20 text-xs text-center py-6">歌单为空，去搜索添加歌曲吧</p>
                          ) : pl.songs.map((song, idx) => (
                            <div key={song.id || idx}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] group cursor-pointer transition-all"
                              onClick={() => handlePlaySong(song, pl.songs)}>
                              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 relative group/thumb">
                                {coverCache[song.id] ? (
                                  <img src={coverCache[song.id]} alt="" loading="lazy" className="w-full h-full object-cover" />
                                ) : null}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                  {loadingSongId === song.id ? (
                                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                      <polygon points="5,3 19,12 5,21" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/80 truncate">{song.title || '未知歌曲'}</p>
                                <p className="text-xs text-white/40 truncate">{song.artist || '未知歌手'}</p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); removeSongFromPlaylist(pl.id, song.id) }}
                                className="p-1.5 rounded-full text-white/20 hover:text-red-400 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
