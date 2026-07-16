'use client'

import { motion } from 'framer-motion'
import { useUIStore } from '@/stores/uiStore'

const navItems = [
  { view: 'mobile' as const, label: '手机' },
  { view: 'mine' as const, label: '我的' },
  { view: 'player' as const, label: '播放' },
  { view: 'search' as const, label: '搜索' },
  { view: 'playlists' as const, label: '歌单' },
  { view: 'song' as const, label: '模组' },
]

export function TopBar() {
  const { currentView, setCurrentView, cycleGlassMode, isMobile } = useUIStore()

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`relative z-30 ${isMobile ? 'px-3 pt-3 pb-1' : 'px-6 pt-4 pb-2'}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className={`flex items-center gap-1 bg-white/[0.04] rounded-2xl p-1 border border-white/[0.06] ${isMobile ? 'w-full justify-between' : ''}`}>
          {navItems.map((item) => (
            <button key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`flex items-center ${isMobile ? 'justify-center gap-0.5 px-2 py-2 text-[10px] flex-1' : 'gap-2 px-4 py-2 text-sm cursor-pointer'} rounded-xl font-semibold transition-all ${
                currentView === item.view ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {!isMobile && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {item.view === 'mine' ? (
                    <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>
                  ) : item.view === 'player' ? (
                    <><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></>
                  ) : item.view === 'search' ? (
                    <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>
                  ) : item.view === 'playlists' ? (
                    <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>
                  ) : item.view === 'song' ? (
                    <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="12" cy="12" r="3" /></>
                  ) : item.view === 'mobile' ? (
                    <><rect x="5" y="2" width="14" height="20" rx="3" /><line x1="12" y1="18" x2="12" y2="18" /></>
                  ) : (
                    <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>
                  )}
                </svg>
              )}
              {item.label}
            </button>
          ))}
        </div>

        {!isMobile && (
          <button onClick={cycleGlassMode} className="bg-white/[0.06] border border-white/[0.06] rounded-full px-4 py-2 text-xs text-white/50 hover:text-white/80 transition-colors">
            毛玻璃
          </button>
        )}
      </div>
    </motion.div>
  )
}
