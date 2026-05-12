import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Heart, ExternalLink, Loader2, Zap, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface CarOffer {
  id: string;
  provider: string;
  model: string;
  category: string;
  price: number;
  transmission: string | null;
  hasAC: boolean | null;
  seats: number | null;
  deepLink: string;
  imageUrl: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  ECONOMICO: 'Econômico', INTERMEDIARIO: 'Intermediário', SUV: 'SUV', LUXO: 'Luxo', VAN: 'Van',
};

const PROVIDER_COLORS: Record<string, string> = {
  LOCALIZA: 'bg-green-500/20 text-green-300',
  MOVIDA: 'bg-blue-500/20 text-blue-300',
  UNIDAS: 'bg-orange-500/20 text-orange-300',
  FOCO: 'bg-purple-500/20 text-purple-300',
  HERTZ: 'bg-yellow-500/20 text-yellow-300',
};

export default function SearchResults() {
  const [params] = useSearchParams();
  const { token } = useAuth();
  const [offers, setOffers] = useState<CarOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const location = params.get('location') || '';
  const startDate = params.get('startDate') || '';
  const endDate = params.get('endDate') || '';

  useEffect(() => {
    fetchOffers();
    if (token) fetchBookmarks();
  }, [params.toString()]);

  async function fetchOffers() {
    setLoading(true);
    const q = new URLSearchParams({ location, startDate, endDate });
    if (categoryFilter) q.set('category', categoryFilter);
    if (providerFilter) q.set('provider', providerFilter);
    try {
      const res = await fetch(`${API}/api/search?${q}`);
      const data = await res.json();
      setOffers(data.results || []);
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBookmarks() {
    try {
      const res = await fetch(`${API}/api/bookmarks`, { headers: { Authorization: `Bearer ${token}` } });
      const data: CarOffer[] = await res.json();
      setBookmarked(new Set(data.map(c => c.id)));
    } catch { /* ignore */ }
  }

  async function toggleBookmark(id: string) {
    if (!token) return;
    const isBookmarked = bookmarked.has(id);
    const method = isBookmarked ? 'DELETE' : 'POST';
    await fetch(`${API}/api/bookmarks/${id}`, { method, headers: { Authorization: `Bearer ${token}` } });
    setBookmarked(prev => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(id); else next.add(id);
      return next;
    });
  }

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 1;

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="flex max-w-7xl mx-auto items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0070F3] to-[#0055B8]">
              <Zap className="text-white h-4 w-4" />
            </div>
            <span className="font-bold text-white/90">LocFly</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <MapPin className="h-4 w-4 text-[#0070F3]" />
            <span className="font-medium text-white">{location || 'Qualquer local'}</span>
            {startDate && <><span>·</span><Calendar className="h-4 w-4" /><span>{startDate} → {endDate}</span></>}
          </div>
          <Link to="/" className="text-sm text-white/50 hover:text-white transition-colors">Nova busca</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {loading ? 'Buscando...' : `${offers.length} carros encontrados`}
            </h1>
            <p className="text-sm text-white/40 mt-1">Ordenados por menor preço · {days} dia{days > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition-all"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setTimeout(fetchOffers, 0); }}
              className="rounded-xl border border-white/10 bg-[#050505] px-3 py-2 text-sm outline-none"
            >
              <option value="">Todas as categorias</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select
              value={providerFilter}
              onChange={e => { setProviderFilter(e.target.value); setTimeout(fetchOffers, 0); }}
              className="rounded-xl border border-white/10 bg-[#050505] px-3 py-2 text-sm outline-none"
            >
              <option value="">Todas as locadoras</option>
              {['LOCALIZA', 'MOVIDA', 'UNIDAS', 'FOCO', 'HERTZ'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button
              onClick={() => { setCategoryFilter(''); setProviderFilter(''); setTimeout(fetchOffers, 200); }}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/50 hover:text-white transition-colors"
            >
              Limpar
            </button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#0070F3]" />
            <p className="text-white/40">Consultando locadoras em tempo real...</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-32 text-white/40">
            <p className="text-lg">Nenhum carro encontrado</p>
            <Link to="/" className="mt-4 inline-block text-[#0070F3] text-sm hover:underline">Tentar nova busca</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <div key={offer.id} className="group relative rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:border-white/20 transition-all">
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-[#111]">
                  {offer.imageUrl && (
                    <img src={offer.imageUrl} alt={offer.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Bookmark */}
                  {token && (
                    <button
                      onClick={() => toggleBookmark(offer.id)}
                      className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all ${bookmarked.has(offer.id) ? 'bg-red-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'}`}
                    >
                      <Heart className={`h-4 w-4 ${bookmarked.has(offer.id) ? 'fill-current' : ''}`} />
                    </button>
                  )}
                  {/* Provider badge */}
                  <span className={`absolute bottom-3 left-3 rounded-full px-2 py-0.5 text-xs font-semibold ${PROVIDER_COLORS[offer.provider] || 'bg-white/20 text-white'}`}>
                    {offer.provider}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{offer.model}</h3>
                      <p className="text-xs text-white/40">{CATEGORY_LABELS[offer.category] || offer.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#0070F3]">R$ {Number(offer.price).toFixed(2)}</p>
                      <p className="text-xs text-white/40">por dia</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4 text-xs text-white/50">
                    {offer.transmission && <span className="rounded-full border border-white/10 px-2 py-0.5">{offer.transmission}</span>}
                    {offer.hasAC && <span className="rounded-full border border-white/10 px-2 py-0.5">Ar-cond.</span>}
                    {offer.seats && <span className="rounded-full border border-white/10 px-2 py-0.5">{offer.seats} lugares</span>}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/60 font-medium">
                      Total: <span className="text-white">R$ {(Number(offer.price) * days).toFixed(2)}</span>
                    </p>
                    <a
                      href={offer.deepLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl bg-[#0070F3] px-4 py-2 text-xs font-semibold hover:bg-[#0060D9] transition-colors"
                    >
                      Reservar <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
