'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useHistoryStore } from '@/stores/historyStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useLyricStore } from '@/stores/lyricStore'
import { useUIStore } from '@/stores/uiStore'
import { gdService } from '@/services/gd-api.service'
import { audioEngine } from '@/lib/audio-engine'
import { LRCParser } from '@/lib/lrc-parser'
import { extractColorsFromImage } from '@/lib/color-thief'

export function HistoryView() {
  const { entries, clearHistory } = useHistoryStore()
  const { setCurrentMusic, setIsPlaying } = usePlayerStore()
  const { setLyrics } = useLyricStore()
  const { setCoverColors, setCurrentView } = useUIStore()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handlePlay = async (entry: typeof entries[0]) => {
    setLoadingId(entry.music.id)
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
      setCurrentView('player')

      if (music.coverUrl) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => setCoverColors(extractColorsFromImage(img))
        img.src = music.coverUrl
      }
    } catch (err) { console.error(err) }
    finally { setLoadingId(null) }
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-y-auto no-scrollbar px-8 pt-6 pb-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white/90">最近播放</h2>
          {entries.length > 0 && (
            <button onClick={clearHistory}
              className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/60 hover:text-white transition-all">
              清除历史
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/15 mb-4">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-white/30 text-sm">还没有播放记录</p>
            <p className="text-white/20 text-xs mt-2">搜索并播放歌曲后，历史将显示在这里</p>
          </div>
        ) : (
          <div className="space-y-1">
            {entries.map((entry, idx) => (
              <motion.div
                key={`${entry.music.id}-${entry.playedAt}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => handlePlay(entry)}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/[0.06] cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {loadingId === entry.music.id ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : entry.music.coverUrl ? (
                    <img src={entry.music.coverUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/30 group-hover:text-white/70">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{entry.music.title || '未知歌曲'}</p>
                  <p className="text-xs text-white/40 truncate mt-0.5">
                    {entry.music.artist || '未知歌手'}
                    {entry.music.album ? ` · ${entry.music.album}` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-white/25 font-mono">{entry.music.source || ''}</p>
                  <p className="text-[10px] text-white/20 mt-0.5">{formatDate(entry.playedAt)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
