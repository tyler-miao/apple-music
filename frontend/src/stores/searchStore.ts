import { create } from 'zustand'

interface SearchResult {
  id: string
  name: string
  artist: string[]
  album: string
  picId: string
  lyricId: string
  source: string
  coverUrl?: string | null
  audioUrl?: string | null
}

interface SearchState {
  query: string
  results: SearchResult[]
  isSearching: boolean
  source: string
  recentSearches: string[]

  setQuery: (query: string) => void
  setResults: (results: SearchResult[]) => void
  setIsSearching: (v: boolean) => void
  setSource: (source: string) => void
  addRecentSearch: (query: string) => void
  clearResults: () => void
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  isSearching: false,
  source: 'netease',
  recentSearches: [],

  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setIsSearching: (v) => set({ isSearching: v }),
  setSource: (source) => set({ source }),
  addRecentSearch: (query) => {
    const { recentSearches } = get()
    const filtered = recentSearches.filter((s) => s !== query)
    set({ recentSearches: [query, ...filtered].slice(0, 10) })
  },
  clearResults: () => set({ results: [], query: '' }),
}))
