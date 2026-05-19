import { create } from 'zustand'

type Category = 'ECONOMICO' | 'INTERMEDIARIO' | 'SUV' | 'LUXO' | 'VAN' | ''

interface SearchParams {
  location: string
  startDate: string
  endDate: string
}

interface SearchFilters {
  maxPrice: number | null
  transmission: string | null
  category: Category
  providers: string[]
}

interface SearchState {
  params: SearchParams
  filters: SearchFilters
  setParams: (params: Partial<SearchParams>) => void
  setFilters: (filters: Partial<SearchFilters>) => void
  resetFilters: () => void
}

const defaultFilters: SearchFilters = {
  maxPrice: null,
  transmission: null,
  category: '',
  providers: [],
}

export const useSearchStore = create<SearchState>((set) => ({
  params: { location: '', startDate: '', endDate: '' },
  filters: defaultFilters,
  setParams: (params) => set((s) => ({ params: { ...s.params, ...params } })),
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
}))
