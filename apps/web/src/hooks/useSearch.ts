import { useQuery } from '@tanstack/react-query'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export interface CarOffer {
  id: string
  provider: string
  model: string
  category: string
  price: number
  transmission: string | null
  hasAC: boolean | null
  seats: number | null
  deepLink: string
  imageUrl: string | null
}

interface SearchParams {
  location: string
  startDate: string
  endDate: string
}

export function useSearch(params: SearchParams) {
  const { location, startDate, endDate } = params
  const enabled = !!(location && startDate && endDate)

  return useQuery<CarOffer[]>({
    queryKey: ['search', location, startDate, endDate],
    queryFn: async () => {
      const q = new URLSearchParams({ location, startDate, endDate })
      const res = await fetch(`${API}/api/search?${q}`)
      if (!res.ok) throw new Error('Erro ao buscar ofertas')
      const data = (await res.json()) as { results: CarOffer[] }
      return data.results ?? []
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
