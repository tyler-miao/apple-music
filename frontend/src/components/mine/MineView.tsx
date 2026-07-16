'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useHistoryStore } from '@/stores/historyStore'
import { usePlaylistStore } from '@/stores/playlistStore'
import { gdService } from '@/services/gd-api.service'
import { audioEngine } from '@/lib/audio-engine'
import { extractColorsFromImage } from '@/lib/color-thief'

interface LikedSong {
  likedAt: string
  musicId: string
  title: string
  artist: string
  album: string
  coverUrl: string | null
  source: string
  sourceId: string | null
}

function formatDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function formatRelativeTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function MineView() {
  const { user, login, register, logout, isLoading, error, clearError, updateAvatar, updateBio } = useAuthStore()
  const { coverColors } = useUIStore()
  const { setCurrentMusic, setIsPlaying } = usePlayerStore()
  const { entries: historyEntries } = useHistoryStore()
  const { playlists } = usePlaylistStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [registerMethod, setRegisterMethod] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showAdmin, setShowAdmin] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [showLiked, setShowLiked] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([])
  const [loadingLiked, setLoadingLiked] = useState(false)
  const [historyLoadingId, setHistoryLoadingId] = useState<string | null>(null)
  const [avatarInput, setAvatarInput] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bioInput, setBioInput] = useState(false)
  const [bioText, setBioText] = useState('')
  const [showMusicAdmin, setShowMusicAdmin] = useState(false)
  const [adminMusic, setAdminMusic] = useState<any[]>([])
  const [adminMusicLoading, setAdminMusicLoading] = useState(false)
  const [musicSearchQuery, setMusicSearchQuery] = useState('')
  const [adminPanel, setAdminPanel] = useState<'users' | 'music' | 'config' | null>(null)
  const [adminStats, setAdminStats] = useState<any>(null)
  const [gdApiUrl, setGdApiUrl] = useState('')
  const [configSaving, setConfigSaving] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)
  const [visitStats, setVisitStats] = useState<any>(null)
  const [loadingVisits, setLoadingVisits] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const ok = mode === 'login'
      ? await login(email || phone, password)
      : await register(registerMethod === 'email' ? email : '', registerMethod === 'phone' ? phone : '', username, password)
    if (ok) { setEmail(''); setPhone(''); setPassword(''); setUsername('') }
  }

  const fetchUsers = async () => {
    setAdminLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch {}
    setAdminLoading(false)
  }

  useEffect(() => { if (showAdmin) fetchUsers() }, [showAdmin])

  const fetchLikedSongs = async () => {
    setLoadingLiked(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/music/liked', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setLikedSongs(await res.json())
    } catch {}
    setLoadingLiked(false)
  }

  const handleToggleLiked = () => {
    const next = !showLiked
    setShowLiked(next)
    setShowHistory(false)
    fetchLikedSongs()
  }

  const handleToggleHistory = () => {
    setShowHistory(!showHistory)
    setShowLiked(false)
  }

  const playMusic = async (id: string, title: string, artist: string, album: string, coverUrl: string | null, source: string, sourceId: string | null) => {
    audioEngine.ensureResumed()
    const music = {
      id,
      title, artist, album, coverUrl,
      audioUrl: null, duration: 0, playCount: 0,
      source, sourceId: sourceId || undefined,
    }
    setCurrentMusic(music)
    setIsPlaying(true)
    useUIStore.getState().setCurrentView('player')
  }

  const unlikeSong = async (musicId: string) => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    try {
      const res = await fetch(`/api/music/${musicId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) setLikedSongs((prev) => prev.filter((s) => s.musicId !== musicId))
    } catch {}
  }

  const playHistoryEntry = async (entry: typeof historyEntries[0]) => {
    setHistoryLoadingId(entry.music.id)
    audioEngine.ensureResumed()
    try {
      const { music } = entry
      if (!music.audioUrl) {
        const source = music.source || 'netease'
        const sourceId = music.sourceId || music.id.replace(/^[^-]+-/, '')
        const audioUrl = await gdService.getUrl(sourceId, source, 320)
        if (!audioUrl) return
        setCurrentMusic({ ...music, audioUrl })
      } else {
        setCurrentMusic(music)
      }
      setIsPlaying(true)
      useUIStore.getState().setCurrentView('player')
      if (music.coverUrl) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => { try { useUIStore.getState().setCoverColors(extractColorsFromImage(img)) } catch {} }
        img.src = music.coverUrl
      }
    } catch {}
    setHistoryLoadingId(null)
  }

  const handleAvatarChange = async () => {
    if (!avatarUrl.trim()) return
    await updateAvatar(avatarUrl.trim())
    setAvatarInput(false)
    setAvatarUrl('')
  }

  const handleBioChange = async () => {
    await updateBio(bioText)
    setBioInput(false)
  }

  const changeRole = async (id: string, role: string) => {
    const token = localStorage.getItem('accessToken')
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    })
    if (res.ok) fetchUsers()
  }

  const deleteUser = async (id: string) => {
    const token = localStorage.getItem('accessToken')
    await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchUsers()
  }

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setAdminStats(await res.json())
    } catch {}
  }

  const fetchAdminConfig = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/admin/config', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setGdApiUrl(data.gd_api_url || '')
      }
    } catch {}
  }

  const saveAdminConfig = async () => {
    setConfigSaving(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gd_api_url: gdApiUrl }),
      })
      if (res.ok) {
        setConfigSaved(true)
        setTimeout(() => setConfigSaved(false), 2000)
      }
    } catch {}
    setConfigSaving(false)
  }

  const fetchAdminMusic = async (search?: string) => {
    setAdminMusicLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      if (search) {
        const data = await gdService.search(search, 'netease', 30)
        setAdminMusic(data.map((item) => ({
          id: item.id,
          title: item.name,
          artist: Array.isArray(item.artist) ? item.artist.join(' / ') : item.artist,
          album: item.album,
          source: item.source,
          coverUrl: null,
          playCount: 0,
          _isExternal: true,
        })))
      } else {
        const params = new URLSearchParams({ limit: '50', page: '1' })
        const res = await fetch(`/api/admin/music?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setAdminMusic(data.musics || [])
        }
      }
    } catch {}
    setAdminMusicLoading(false)
  }

  const fetchVisitStats = async () => {
    setLoadingVisits(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/admin/visits', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setVisitStats(await res.json())
    } catch {}
    setLoadingVisits(false)
  }

  const deleteAdminMusic = async (id: string) => {
    const token = localStorage.getItem('accessToken')
    try {
      await fetch(`/api/admin/music/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchAdminMusic(musicSearchQuery)
    } catch {}
  }

  if (user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 overflow-y-auto no-scrollbar"
      >
        {/* 渐变头图 */}
        <div className="relative h-[26vh] min-h-[200px] overflow-hidden">
          <div className="absolute inset-0" style={{
            background: `linear-gradient(145deg, ${coverColors.vibrant}99 0%, ${coverColors.dark}88 50%, #000 100%)`,
          }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 40%, transparent 65%)' }} />

          <div className="absolute bottom-0 left-0 right-0 px-[6vw] pb-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center gap-4"
            >
              <div className="relative group cursor-pointer" onClick={() => setAvatarInput(true)}>
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-xl" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-2xl flex items-center justify-center text-xl font-bold text-white shadow-xl border-2 border-white/20">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">{user.username}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-sm text-white/50 truncate max-w-[180px]">{user.email}</span>
                  {user.role === 'ADMIN' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 border border-yellow-400/20 leading-none">管理员</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 group cursor-pointer" onClick={() => { setBioText(user.bio || ''); setBioInput(true) }}>
                  <p className={`text-xs ${user.bio ? 'text-white/40' : 'text-white/20'} truncate max-w-[260px] transition-colors group-hover:text-white/60`}>
                    {user.bio || '添加个性签名...'}
                  </p>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20 group-hover:text-white/40 transition-colors">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                {user.createdAt && <p className="text-[11px] text-white/25 mt-0.5">{formatDate(user.createdAt)} 加入</p>}
              </div>
            </motion.div>
          </div>
        </div>

        {/* 头像更换输入 */}
        <AnimatePresence>
          {avatarInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden px-[6vw]"
            >
              <div className="rounded-xl backdrop-blur-xl border border-white/[0.06] p-3 flex gap-2 mb-2"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="输入头像图片 URL..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/20 placeholder:text-white/20" />
                <button onClick={handleAvatarChange}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-white transition-all">确定</button>
                <button onClick={() => setAvatarInput(false)}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white/50 transition-all">取消</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 签名编辑输入 */}
        <AnimatePresence>
          {bioInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden px-[6vw]"
            >
              <div className="rounded-xl backdrop-blur-xl border border-white/[0.06] p-3 flex gap-2 mb-2"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <input value={bioText} onChange={(e) => setBioText(e.target.value)}
                  placeholder="写一句个性签名..."
                  maxLength={100}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/20 placeholder:text-white/20" />
                <button onClick={handleBioChange}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-white transition-all">保存</button>
                <button onClick={() => setBioInput(false)}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white/50 transition-all">取消</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 内容区 */}
        <div className="px-[6vw] pt-3 pb-8 space-y-3">
          {/* 数据卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid grid-cols-3 gap-2.5"
          >
            <button onClick={handleToggleLiked}
              className="rounded-2xl p-3.5 backdrop-blur-xl border border-white/[0.06] text-left transition-all hover:bg-white/[0.06] active:scale-[0.97]"
              style={{ background: showLiked ? 'rgba(244,63,94,0.08)' : 'rgba(255,255,255,0.03)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={showLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className={`mb-2 ${showLiked ? 'text-red-400' : 'text-red-400/60'}`}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <p className="text-lg font-bold text-white tracking-tight">{likedSongs.length}</p>
              <p className="text-[10px] text-white/40 mt-0.5">我喜欢的</p>
            </button>
            <button onClick={handleToggleHistory}
              className="rounded-2xl p-3.5 backdrop-blur-xl border border-white/[0.06] text-left transition-all hover:bg-white/[0.06] active:scale-[0.97]"
              style={{ background: showHistory ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.03)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`mb-2 ${showHistory ? 'text-blue-400' : 'text-blue-400/60'}`}>
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-lg font-bold text-white tracking-tight">{historyEntries.length}</p>
              <p className="text-[10px] text-white/40 mt-0.5">最近播放</p>
            </button>
            <button onClick={() => useUIStore.getState().setCurrentView('playlists')}
              className="rounded-2xl p-3.5 backdrop-blur-xl border border-white/[0.06] text-left transition-all hover:bg-white/[0.06] active:scale-[0.97]"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 mb-2">
                <path d="M9 18V5l12-2v13M6 18c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V5" />
              </svg>
              <p className="text-lg font-bold text-white tracking-tight">{playlists.length}</p>
              <p className="text-[10px] text-white/40 mt-0.5">歌单</p>
            </button>
          </motion.div>

          {/* 我喜欢的音乐 */}
          {showLiked && (
            <motion.div key="liked-panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl backdrop-blur-xl border border-white/[0.06] p-4"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400/60">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                我喜欢的音乐
              </h3>
              {loadingLiked ? (
                <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
              ) : likedSongs.length === 0 ? (
                <div className="text-center py-6">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-white/15 mx-auto mb-2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <p className="text-white/30 text-xs">还没有喜欢的歌曲</p>
                  <p className="text-white/15 text-[10px] mt-1">去搜索页点❤️收藏</p>
                </div>
              ) : (
                <div className="space-y-0.5 max-h-[50vh] overflow-y-auto">
                  {likedSongs.map((song) => (
                    <div key={song.musicId}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] group transition-all cursor-pointer"
                      onClick={() => playMusic(song.musicId, song.title, song.artist, song.album, song.coverUrl, song.source, song.sourceId)}>
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/30"><polygon points="5,3 19,12 5,21" /></svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white/90 truncate">{song.title || '未知歌曲'}</p>
                        <p className="text-[11px] text-white/40 truncate">{song.artist || '未知歌手'}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {song.source && <span className="text-[9px] text-white/20 font-mono px-1.5 py-0.5 rounded bg-white/5">{song.source}</span>}
                        <button onClick={(e) => { e.stopPropagation(); unlikeSong(song.musicId) }}
                          className="p-1.5 rounded-full text-white/20 hover:text-red-400/70 hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* 最近播放 */}
          {showHistory && (
            <motion.div key="history-panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl backdrop-blur-xl border border-white/[0.06] p-4"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400/60">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                最近播放
              </h3>
              {historyEntries.length === 0 ? (
                <div className="text-center py-6">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-white/15 mx-auto mb-2">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <p className="text-white/30 text-xs">还没有播放记录</p>
                </div>
              ) : (
                <div className="space-y-0.5 max-h-[50vh] overflow-y-auto">
                  {historyEntries.slice(0, 30).map((entry) => (
                    <div key={`${entry.music.id}-${entry.playedAt}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] group transition-all cursor-pointer"
                      onClick={() => playHistoryEntry(entry)}>
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        {historyLoadingId === entry.music.id ? (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/30"><polygon points="5,3 19,12 5,21" /></svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white/90 truncate">{entry.music.title || '未知歌曲'}</p>
                        <p className="text-[11px] text-white/40 truncate">{entry.music.artist || '未知歌手'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {entry.music.source && <span className="text-[9px] text-white/20 font-mono">{entry.music.source}</span>}
                        <span className="text-[9px] text-white/25 whitespace-nowrap">{formatRelativeTime(entry.playedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* 设置 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="rounded-2xl backdrop-blur-xl border border-white/[0.06] overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="px-5 pt-4 pb-2"><h3 className="text-xs font-semibold text-white/50 tracking-widest uppercase">设置</h3></div>
            <button onClick={logout}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors group">
              <span className="flex items-center gap-3.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="text-sm text-white/60 group-hover:text-white transition-colors">退出登录</span>
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </motion.div>

          {/* 管理员面板 */}
          {user.role === 'ADMIN' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {/* 统计卡片 */}
              {adminStats && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-6 gap-2 mb-3">
                  {[
                    { label: '用户', value: adminStats.totalUsers, color: 'text-blue-400' },
                    { label: '音乐', value: adminStats.totalMusic, color: 'text-green-400' },
                    { label: '歌单', value: adminStats.totalPlaylists, color: 'text-purple-400' },
                    { label: '播放', value: adminStats.totalPlays, color: 'text-orange-400' },
                    { label: '收藏', value: adminStats.totalLiked, color: 'text-red-400' },
                    { label: '访问', value: visitStats?.totalVisits ?? '...', color: 'text-cyan-400' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-3 backdrop-blur-xl border border-white/[0.06] text-center"
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className={`text-lg font-bold ${s.color} tracking-tight`}>{s.value}</p>
                      <p className="text-[9px] text-white/35 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              <div className="flex gap-2 mb-2">
                <button onClick={() => { const n = adminPanel === 'users' ? null : 'users'; setAdminPanel(n); if (n) { fetchUsers(); fetchAdminStats(); fetchVisitStats() } }}
                  className={`flex-1 px-4 py-3 rounded-2xl backdrop-blur-xl border text-sm font-medium transition-all ${adminPanel === 'users' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-white/[0.03] border-white/[0.06] text-white/60'}`}>
                  用户管理
                </button>
                <button onClick={() => { const n = adminPanel === 'music' ? null : 'music'; setAdminPanel(n); if (n) { fetchAdminMusic(musicSearchQuery); fetchAdminStats(); fetchVisitStats() } }}
                  className={`flex-1 px-4 py-3 rounded-2xl backdrop-blur-xl border text-sm font-medium transition-all ${adminPanel === 'music' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-white/[0.03] border-white/[0.06] text-white/60'}`}>
                  音乐管理
                </button>
                <button onClick={() => { const n = adminPanel === 'config' ? null : 'config'; setAdminPanel(n); if (n) { fetchAdminConfig(); fetchAdminStats(); fetchVisitStats() } }}
                  className={`flex-1 px-4 py-3 rounded-2xl backdrop-blur-xl border text-sm font-medium transition-all ${adminPanel === 'config' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-white/[0.03] border-white/[0.06] text-white/60'}`}>
                  系统配置
                </button>
              </div>
              <AnimatePresence>
                {adminPanel === 'users' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="mt-1 space-y-1.5">
                      {adminLoading ? (
                        <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" /></div>
                      ) : users.length === 0 ? (
                        <p className="text-center text-white/30 py-6 text-xs">暂无用户</p>
                      ) : (
                        users.map((u: any) => (
                          <div key={u.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <div className="min-w-0 flex-1 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60 shrink-0">{u.username[0].toUpperCase()}</div>
                              <div className="min-w-0"><p className="text-sm font-medium text-white/80 truncate">{u.username}</p><p className="text-[11px] text-white/40 truncate">{u.email}</p></div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-yellow-500/15 text-yellow-500/70' : 'bg-blue-500/15 text-blue-400/70'}`}>{u.role === 'ADMIN' ? '管理员' : '用户'}</span>
                              <button onClick={() => changeRole(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN')} className="px-2 py-1 text-[10px] rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all">切换</button>
                              <button onClick={() => deleteUser(u.id)} className="px-2 py-1 text-[10px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/70 hover:text-red-400 transition-all">删除</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
                {adminPanel === 'music' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="mt-1 space-y-2">
                      <div className="flex gap-2">
                        <input value={musicSearchQuery} onChange={(e) => setMusicSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && fetchAdminMusic(musicSearchQuery)}
                          placeholder="搜索网易云音乐..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20 placeholder:text-white/20" />
                        <button onClick={() => fetchAdminMusic(musicSearchQuery)}
                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white transition-all">搜索</button>
                      </div>
                      {adminMusicLoading ? (
                        <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" /></div>
                      ) : adminMusic.length === 0 ? (
                        <p className="text-center text-white/30 py-6 text-xs">暂无音乐数据</p>
                      ) : (
                        <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                          {adminMusic.map((m: any) => (
                            <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                              <div className="min-w-0 flex-1 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs text-white/40 shrink-0">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white/80 truncate">{m.title || '未知'}</p>
                                  <p className="text-[10px] text-white/40 truncate">{m.artist || '未知'}{m.album ? ` · ${m.album}` : ''}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className="text-[9px] text-white/20 font-mono">{m.source || 'netease'}</span>
                                {!m._isExternal && <span className="text-[10px] text-white/25">{m.playCount || 0}次</span>}
                                {!m._isExternal && <button onClick={() => deleteAdminMusic(m.id)}
                                  className="px-2 py-1 text-[10px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/70 hover:text-red-400 transition-all">删除</button>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
                {adminPanel === 'config' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="mt-1 rounded-2xl p-4 backdrop-blur-xl border border-white/[0.06]"
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <h3 className="text-sm font-semibold text-white/70 mb-3">音乐 API 配置</h3>
                      <label className="text-[11px] text-white/30 font-medium block mb-1">GD API 地址</label>
                      <div className="flex gap-2">
                        <input value={gdApiUrl} onChange={(e) => setGdApiUrl(e.target.value)}
                          placeholder="https://music-api.gdstudio.xyz/api.php"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 placeholder:text-white/20 font-mono" />
                        <button onClick={saveAdminConfig} disabled={configSaving}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white transition-all disabled:opacity-40 flex items-center gap-1.5">
                          {configSaving ? '保存中...' : configSaved ? '已保存 ✓' : '保存'}
                        </button>
                      </div>
                      <p className="text-[10px] text-white/25 mt-2">修改后立即生效，无需重启服务。支持任何兼容 GD API 协议的音乐接口。</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center p-[6vw]">
      <div className="w-full max-w-sm">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }} className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-white/[0.04] mx-auto flex items-center justify-center mb-5 border border-white/[0.06]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-white/30"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{mode === 'login' ? '欢迎回来' : '创建账户'}</h2>
          <p className="text-sm text-white/40 mt-1.5">{mode === 'login' ? '登录以同步你的音乐数据' : '注册以开始你的音乐之旅'}</p>
        </motion.div>
        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div className="flex rounded-2xl bg-white/[0.04] border border-white/[0.06] p-1">
              <button type="button" onClick={() => { setRegisterMethod('email'); setPhone('') }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${registerMethod === 'email' ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}>邮箱注册</button>
              <button type="button" onClick={() => { setRegisterMethod('phone'); setEmail('') }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${registerMethod === 'phone' ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}>手机号注册</button>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[11px] text-white/30 font-medium px-1">{mode === 'login' ? '邮箱 / 手机号' : registerMethod === 'email' ? '邮箱' : '手机号'}</label>
            {mode === 'login' || registerMethod === 'email' ? (
              <input type={mode === 'login' ? 'text' : 'email'} placeholder={mode === 'login' ? 'your@email.com 或手机号' : 'your@email.com'} value={email} required onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white text-sm outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all placeholder:text-white/15" />
            ) : (
              <input type="tel" placeholder="13800138000" value={phone} required pattern="1\d{10}" onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white text-sm outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all placeholder:text-white/15" />
            )}
          </div>
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-[11px] text-white/30 font-medium px-1">用户名</label>
              <input type="text" placeholder="你的昵称" value={username} required minLength={2} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white text-sm outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all placeholder:text-white/15" />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[11px] text-white/30 font-medium px-1">密码</label>
            <input type="password" placeholder="至少6位" value={password} required minLength={6} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white text-sm outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all placeholder:text-white/15" />
          </div>
          <AnimatePresence>{error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-400/80 text-xs text-center py-1">{error}</motion.p>}</AnimatePresence>
          <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all disabled:opacity-40 mt-1">
            {isLoading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />处理中...</span> : mode === 'login' ? '登录' : '创建账户'}
          </button>
        </motion.form>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-center text-xs text-white/30 mt-8">
          {mode === 'login' ? '还没有账户？' : '已有账户？'}
          <button onClick={() => { clearError(); setMode(mode === 'login' ? 'register' : 'login'); setEmail(''); setPhone('') }} className="text-white/60 hover:text-white ml-1.5 underline underline-offset-2 transition-colors">{mode === 'login' ? '注册' : '登录'}</button>
        </motion.p>
        <motion.p className="text-center text-[10px] text-white/15 mt-4">第一个注册的用户自动成为管理员</motion.p>
      </div>
    </motion.div>
  )
}
