'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { gdService } from '@/services/gd-api.service'

export function AdminView() {
  const { user } = useAuthStore()
  const { setCurrentView } = useUIStore()
  const [adminPanel, setAdminPanel] = useState<'users' | 'music' | 'config' | null>(null)
  const [adminStats, setAdminStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [musicSearchQuery, setMusicSearchQuery] = useState('')
  const [adminMusic, setAdminMusic] = useState<any[]>([])
  const [adminMusicLoading, setAdminMusicLoading] = useState(false)
  const [gdApiUrl, setGdApiUrl] = useState('')
  const [configSaving, setConfigSaving] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setAdminStats(await res.json())
    } catch {}
  }

  const fetchUsers = async () => {
    setAdminLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const data = await res.json(); setUsers(data.users || []) }
    } catch {}
    setAdminLoading(false)
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
    fetchUsers(); fetchAdminStats()
  }

  const fetchAdminMusic = async (search?: string) => {
    setAdminMusicLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      if (search) {
        const data = await gdService.search(search, 'netease', 30)
        setAdminMusic(data.map((item: any) => ({
          id: item.id, title: item.name,
          artist: Array.isArray(item.artist) ? item.artist.join(' / ') : item.artist,
          album: item.album, source: item.source, coverUrl: null, playCount: 0, _isExternal: true,
        })))
      } else {
        const params = new URLSearchParams({ limit: '50', page: '1' })
        const res = await fetch(`/api/admin/music?${params}`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) { const data = await res.json(); setAdminMusic(data.musics || []) }
      }
    } catch {}
    setAdminMusicLoading(false)
  }

  const deleteAdminMusic = async (id: string) => {
    const token = localStorage.getItem('accessToken')
    try {
      await fetch(`/api/admin/music/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      fetchAdminMusic(musicSearchQuery); fetchAdminStats()
    } catch {}
  }

  const fetchAdminConfig = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/admin/config', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const data = await res.json(); setGdApiUrl(data.gd_api_url || '') }
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
      if (res.ok) { setConfigSaved(true); setTimeout(() => setConfigSaved(false), 2000) }
    } catch {}
    setConfigSaving(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-[6vw] py-4">
      {/* 统计卡片 */}
      {adminStats && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
          {[
            { label: '用户', value: adminStats.totalUsers, color: 'text-blue-400' },
            { label: '音乐', value: adminStats.totalMusic, color: 'text-green-400' },
            { label: '歌单', value: adminStats.totalPlaylists, color: 'text-purple-400' },
            { label: '播放', value: adminStats.totalPlays, color: 'text-orange-400' },
            { label: '收藏', value: adminStats.totalLiked, color: 'text-red-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 backdrop-blur-xl border border-white/[0.06] text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className={`text-lg sm:text-xl font-bold ${s.color} tracking-tight`}>{s.value}</p>
              <p className="text-[9px] text-white/35 mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        {(['users', 'music', 'config'] as const).map((tab) => (
          <button key={tab} onClick={() => { const n = adminPanel === tab ? null : tab; setAdminPanel(n); if (n) { fetchAdminStats(); if (tab === 'users') fetchUsers(); if (tab === 'music') fetchAdminMusic(); if (tab === 'config') fetchAdminConfig() } }}
            className={`whitespace-nowrap px-4 py-3 rounded-2xl backdrop-blur-xl border text-sm font-medium transition-all ${adminPanel === tab ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:text-white/80'}`}>
            {tab === 'users' ? '用户管理' : tab === 'music' ? '音乐管理' : '系统配置'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {adminPanel === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {adminLoading ? (
              <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" /></div>
            ) : users.length === 0 ? (
              <p className="text-center text-white/30 py-8 text-xs">暂无用户</p>
            ) : (
              <div className="space-y-1.5">
                {users.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60 shrink-0">{u.username?.[0]?.toUpperCase()}</div>
                      <div className="min-w-0"><p className="text-sm font-medium text-white/80 truncate">{u.username}</p><p className="text-[11px] text-white/40 truncate">{u.email}</p></div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-yellow-500/15 text-yellow-500/70' : 'bg-blue-500/15 text-blue-400/70'}`}>{u.role === 'ADMIN' ? '管理员' : '用户'}</span>
                      <button onClick={() => changeRole(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN')} className="px-2 py-1 text-[10px] rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all">切换</button>
                      <button onClick={() => deleteUser(u.id)} className="px-2 py-1 text-[10px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/70 hover:text-red-400 transition-all">删除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
        {adminPanel === 'music' && (
          <motion.div key="music" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <div className="flex gap-2 mb-3">
              <input value={musicSearchQuery} onChange={(e) => setMusicSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAdminMusic(musicSearchQuery)}
                placeholder="搜索网易云音乐..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-white/20 placeholder:text-white/20" />
              <button onClick={() => fetchAdminMusic(musicSearchQuery)} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white transition-all">搜索</button>
            </div>
            {adminMusicLoading ? (
              <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" /></div>
            ) : adminMusic.length === 0 ? (
              <p className="text-center text-white/30 py-8 text-xs">暂无音乐数据</p>
            ) : (
              <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                {adminMusic.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs text-white/40 shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                      </div>
                      <div className="min-w-0"><p className="text-sm font-medium text-white/80 truncate">{m.title || '未知'}</p><p className="text-[10px] text-white/40 truncate">{m.artist || '未知'}{m.album ? ` · ${m.album}` : ''}</p></div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[9px] text-white/20 font-mono">{m.source || 'netease'}</span>
                      {!m._isExternal && <span className="text-[10px] text-white/25 hidden sm:inline">{m.playCount || 0}次</span>}
                      {!m._isExternal && <button onClick={() => deleteAdminMusic(m.id)} className="px-2 py-1 text-[10px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/70 hover:text-red-400 transition-all">删除</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
        {adminPanel === 'config' && (
          <motion.div key="config" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            className="rounded-2xl p-4 backdrop-blur-xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-sm font-semibold text-white/70 mb-3">音乐 API 配置</h3>
            <label className="text-[11px] text-white/30 font-medium block mb-1">GD API 地址</label>
            <div className="flex gap-2">
              <input value={gdApiUrl} onChange={(e) => setGdApiUrl(e.target.value)}
                placeholder="https://music-api.gdstudio.xyz/api.php"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 placeholder:text-white/20 font-mono" />
              <button onClick={saveAdminConfig} disabled={configSaving}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white transition-all disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap">
                {configSaving ? '保存中...' : configSaved ? '已保存 ✓' : '保存'}
              </button>
            </div>
            <p className="text-[10px] text-white/25 mt-2">修改后立即生效，无需重启服务。</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
