import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Zap, SlidersHorizontal, Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast, ToastContainer } from '../components/Toast';
import { useSearch, type CarOffer } from '../hooks/useSearch';
import { CarOfferCard } from '../components/CarOfferCard';
import { SearchFilters } from '../components/SearchFilters';
import { useSearchStore } from '../stores/searchStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const CATEGORY_LABELS: Record<string, string> = {
  ECONOMICO: 'Econômico', INTERMEDIARIO: 'Intermediário', SUV: 'SUV', LUXO: 'Luxo', VAN: 'Van',
};

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden animate-pulse">
      <div className="h-44 bg-white/10" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-3 w-20 rounded bg-white/10" />
          </div>
          <div className="space-y-2 items-end flex flex-col">
            <div className="h-5 w-20 rounded bg-white/10" />
            <div className="h-3 w-10 rounded bg-white/10" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-white/10" />
          <div className="h-6 w-14 rounded-full bg-white/10" />
          <div className="h-6 w-18 rounded-full bg-white/10" />
        </div>
        <div className="flex justify-between items-center pt-1">
          <div className="h-4 w-28 rounded bg-white/10" />
          <div className="h-8 w-20 rounded-xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}

interface AlertModalProps {
  location: string;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}

function AlertModal({ location, token, onClose, onSaved }: AlertModalProps) {
  const [targetPrice, setTargetPrice] = useState('');
  const [carCategory, setCarCategory] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!targetPrice || parseFloat(targetPrice) <= 0) return;
    setSaving(true);
    try {
      await fetch(`${API}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ location, targetPrice: parseFloat(targetPrice), carCategory: carCategory || undefined }),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0e0e0e] p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#0070F3]" />
              <h2 className="font-semibold text-lg">Criar alerta de preço</h2>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-1 block">Local</label>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/60">{location || 'Qualquer local'}</div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-1 block">Preço alvo (R$/dia)</label>
              <input
                type="number"
                min="1"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                placeholder="Ex: 120"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0070F3]/50 transition-colors placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-1 block">Categoria (opcional)</label>
              <select
                value={carCategory}
                onChange={e => setCarCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0e0e0e] px-3 py-2.5 text-sm text-white outline-none focus:border-[#0070F3]/50 transition-colors"
              >
                <option value="">Qualquer categoria</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving || !targetPrice}
            className="mt-6 w-full rounded-xl bg-[#0070F3] py-3 text-sm font-semibold hover:bg-[#0060D9] transition-colors disabled:opacity-40"
          >
            {saving ? 'Salvando...' : 'Criar alerta'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function SearchResults() {
  const [params] = useSearchParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const { filters, resetFilters } = useSearchStore();

  const location = params.get('location') || '';
  const startDate = params.get('startDate') || '';
  const endDate = params.get('endDate') || '';

  const { data: offers = [], isLoading, error } = useSearch({ location, startDate, endDate });

  const filtered = useMemo(() => {
    return offers.filter((o) => {
      if (filters.category && o.category !== filters.category) return false;
      if (filters.providers?.length && !filters.providers.includes(o.provider)) return false;
      if (filters.transmission && o.transmission !== filters.transmission) return false;
      if (filters.maxPrice && Number(o.price) > filters.maxPrice) return false;
      return true;
    });
  }, [offers, filters]);

  useEffect(() => {
    if (token) fetchBookmarks();
  }, [token]);

  async function fetchBookmarks() {
    try {
      const res = await fetch(`${API}/api/bookmarks`, { headers: { Authorization: `Bearer ${token}` } });
      const data: CarOffer[] = await res.json();
      setBookmarked(new Set(data.map(c => c.id)));
    } catch { /* ignore */ }
  }

  async function toggleBookmark(id: string) {
    if (!token) { navigate('/login'); return; }
    const isBookmarked = bookmarked.has(id);
    const method = isBookmarked ? 'DELETE' : 'POST';
    await fetch(`${API}/api/bookmarks/${id}`, { method, headers: { Authorization: `Bearer ${token}` } });
    setBookmarked(prev => {
      const next = new Set(prev);
      if (isBookmarked) { next.delete(id); addToast('Removido dos favoritos', 'info'); }
      else { next.add(id); addToast('Adicionado aos favoritos ❤️', 'success'); }
      return next;
    });
  }

  function handleAlertClick() {
    if (!token) { navigate('/login'); return; }
    setShowAlertModal(true);
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
              {isLoading
              ? 'Consultando locadoras...'
              : filtered.length !== offers.length
                ? `${filtered.length} carros encontrados (${offers.length} total)`
                : `${offers.length} carros encontrados`}
            </h1>
            <p className="text-sm text-white/40 mt-1">Ordenados por menor preço · {days} dia{days > 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAlertClick}
              className="flex items-center gap-2 rounded-xl border border-[#0070F3]/30 bg-[#0070F3]/10 px-4 py-2 text-sm text-[#0070F3] hover:bg-[#0070F3]/20 transition-all"
            >
              <Bell className="h-4 w-4" />
              Alerta de preço
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition-all"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && <SearchFilters />}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-32 text-white/40">
            <p className="text-lg">Erro ao buscar ofertas. Tente novamente.</p>
            <Link to="/" className="mt-4 inline-block text-[#0070F3] text-sm hover:underline">Nova busca</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 text-white/40">
            <p className="text-lg">
              {offers.length > 0 ? 'Nenhum carro corresponde aos filtros' : 'Nenhum carro encontrado'}
            </p>
            {offers.length > 0 ? (
              <button
                onClick={resetFilters}
                className="mt-4 inline-block text-[#0070F3] text-sm hover:underline"
              >
                Limpar filtros
              </button>
            ) : (
              <Link to="/" className="mt-4 inline-block text-[#0070F3] text-sm hover:underline">
                Tentar nova busca
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((offer) => (
              <CarOfferCard
                key={offer.id}
                offer={offer}
                days={days}
                isBookmarked={bookmarked.has(offer.id!)}
                onBookmark={toggleBookmark}
              />
            ))}
          </div>
        )}
      </div>

      {showAlertModal && token && (
        <AlertModal
          location={location}
          token={token}
          onClose={() => setShowAlertModal(false)}
          onSaved={() => addToast('Alerta criado! Você será notificado quando o preço cair.', 'success')}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
