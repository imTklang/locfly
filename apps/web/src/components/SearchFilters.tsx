import { useSearchStore } from '../stores/searchStore'

const CATEGORIES = [
  { value: 'ECONOMICO', label: 'Econômico' },
  { value: 'INTERMEDIARIO', label: 'Intermediário' },
  { value: 'SUV', label: 'SUV' },
  { value: 'LUXO', label: 'Luxo' },
  { value: 'VAN', label: 'Van' },
]

const PROVIDERS = ['MOVIDA', 'UNIDAS', 'FOCO']

const TRANSMISSIONS = [
  { value: '', label: 'Todos' },
  { value: 'Manual', label: 'Manual' },
  { value: 'Automático', label: 'Automático' },
]

export function SearchFilters() {
  const { filters, setFilters, resetFilters } = useSearchStore()

  const hasActive =
    !!filters.category ||
    (filters.providers?.length ?? 0) > 0 ||
    !!filters.transmission ||
    !!filters.maxPrice

  function toggleProvider(p: string) {
    const current = filters.providers ?? []
    const next = current.includes(p)
      ? current.filter((x) => x !== p)
      : [...current, p]
    setFilters({ providers: next })
  }

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
      {/* Row 1: Categoria + Câmbio + Preço máx */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Categoria */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Categoria
          </label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value as never })}
            className="rounded-xl border border-white/10 bg-[#050505] px-3 py-2 text-sm outline-none focus:border-[#0070F3]/50 transition-colors"
          >
            <option value="">Todas</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Câmbio */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Câmbio
          </label>
          <div className="flex rounded-xl border border-white/10 overflow-hidden">
            {TRANSMISSIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => setFilters({ transmission: t.value || null })}
                className={`px-3 py-2 text-sm transition-colors ${
                  (filters.transmission ?? '') === t.value
                    ? 'bg-[#0070F3] text-white'
                    : 'bg-[#050505] text-white/60 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preço máximo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Preço máx (R$/dia)
          </label>
          <input
            type="number"
            min="1"
            placeholder="Sem limite"
            value={filters.maxPrice ?? ''}
            onChange={(e) =>
              setFilters({ maxPrice: e.target.value ? Number(e.target.value) : null })
            }
            className="w-36 rounded-xl border border-white/10 bg-[#050505] px-3 py-2 text-sm outline-none focus:border-[#0070F3]/50 transition-colors placeholder:text-white/30"
          />
        </div>

        {hasActive && (
          <button
            onClick={resetFilters}
            className="ml-auto self-end rounded-xl border border-white/10 px-3 py-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Row 2: Locadoras */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
          Locadoras
        </label>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => {
            const active = (filters.providers ?? []).includes(p)
            return (
              <button
                key={p}
                onClick={() => toggleProvider(p)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                  active
                    ? 'border-[#0070F3] bg-[#0070F3]/20 text-[#0070F3]'
                    : 'border-white/10 bg-transparent text-white/50 hover:text-white'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
