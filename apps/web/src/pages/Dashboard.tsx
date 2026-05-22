import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Heart, Bell, LogOut, ExternalLink, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast, ToastContainer } from '../components/Toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface CarOffer {
  id: string;
  provider: string;
  model: string;
  category: string;
  price: number;
  imageUrl: string | null;
  deepLink: string;
}

interface Alert {
  id: string;
  location: string;
  targetPrice: number;
  carCategory: string | null;
  createdAt: string;
  isActive: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  ECONOMICO: 'Econômico', INTERMEDIARIO: 'Intermediário', SUV: 'SUV', LUXO: 'Luxo', VAN: 'Van',
};

const PROVIDER_COLORS: Record<string, string> = {
  MOVIDA: 'bg-blue-500/20 text-blue-300',
  UNIDAS: 'bg-orange-500/20 text-orange-300',
  FOCO: 'bg-purple-500/20 text-purple-300',
};

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [bookmarks, setBookmarks] = useState<CarOffer[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tab, setTab] = useState<'bookmarks' | 'alerts'>('bookmarks');

  // Alert form state
  const [alertLocation, setAlertLocation] = useState('');
  const [alertPrice, setAlertPrice] = useState('');
  const [alertCategory, setAlertCategory] = useState('');
  const [savingAlert, setSavingAlert] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchData();
  }, [token]);

  async function fetchData() {
    const headers = { Authorization: `Bearer ${token}` };
    const [bRes, aRes] = await Promise.all([
      fetch(`${API}/api/bookmarks`, { headers }),
      fetch(`${API}/api/alerts`, { headers }),
    ]);
    if (bRes.ok) setBookmarks(await bRes.json());
    if (aRes.ok) setAlerts(await aRes.json());
  }

  async function removeBookmark(id: string) {
    await fetch(`${API}/api/bookmarks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setBookmarks(b => b.filter(c => c.id !== id));
    addToast('Removido dos favoritos', 'info');
  }

  async function removeAlert(id: string) {
    await fetch(`${API}/api/alerts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setAlerts(a => a.filter(x => x.id !== id));
    addToast('Alerta removido', 'info');
  }

  async function createAlert() {
    if (!alertLocation.trim() || !alertPrice || parseFloat(alertPrice) <= 0) return;
    setSavingAlert(true);
    try {
      const res = await fetch(`${API}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          location: alertLocation,
          targetPrice: parseFloat(alertPrice),
          carCategory: alertCategory || undefined,
        }),
      });
      if (res.ok) {
        const newAlert = await res.json();
        setAlerts(prev => [newAlert, ...prev]);
        setAlertLocation('');
        setAlertPrice('');
        setAlertCategory('');
        addToast('Alerta criado com sucesso!', 'success');
      }
    } finally {
      setSavingAlert(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA]">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="flex max-w-5xl mx-auto items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0070F3] to-[#0055B8]">
              <Zap className="text-white h-4 w-4" />
            </div>
            <span className="font-bold text-white/90">LocFly</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/50">Olá, {user?.name || user?.email}</span>
            <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">Minha conta</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 rounded-xl border border-white/10 bg-white/5 p-1 w-fit">
          {(['bookmarks', 'alerts'] as const).map(t => (
            <button
              key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
            >
              {t === 'bookmarks'
                ? <><Heart className="h-4 w-4" /> Favoritos ({bookmarks.length})</>
                : <><Bell className="h-4 w-4" /> Alertas ({alerts.length})</>}
            </button>
          ))}
        </div>

        {/* Bookmarks Tab */}
        {tab === 'bookmarks' && (
          bookmarks.length === 0
            ? <p className="text-white/40 py-16 text-center">Nenhum favorito ainda. <Link to="/" className="text-[#0070F3] hover:underline">Buscar carros</Link></p>
            : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarks.map(offer => (
                  <div key={offer.id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden group hover:border-white/20 transition-all">
                    <div className="relative h-36 bg-[#111]">
                      {offer.imageUrl
                        ? <img src={offer.imageUrl} alt={offer.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-white/10 text-3xl">🚗</div>
                      }
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className={`absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-xs font-semibold ${PROVIDER_COLORS[offer.provider] || 'bg-white/20 text-white'}`}>
                        {offer.provider}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-semibold">{offer.model}</p>
                          <p className="text-xs text-white/40">{CATEGORY_LABELS[offer.category] || offer.category}</p>
                        </div>
                        <p className="text-[#0070F3] font-bold text-sm">R$ {Number(offer.price).toFixed(2)}<span className="text-xs text-white/40">/dia</span></p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <a href={offer.deepLink} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-[#0070F3] py-2 text-xs font-semibold hover:bg-[#0060D9] transition-colors">
                          Reservar <ExternalLink className="h-3 w-3" />
                        </a>
                        <button onClick={() => removeBookmark(offer.id)} className="flex items-center justify-center h-9 w-9 rounded-xl border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/30 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
        )}

        {/* Alerts Tab */}
        {tab === 'alerts' && (
          <div className="space-y-6">
            {/* Create alert form */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#0070F3]" /> Novo alerta de preço
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Cidade ou aeroporto"
                  value={alertLocation}
                  onChange={e => setAlertLocation(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#050505] px-3 py-2.5 text-sm text-white outline-none focus:border-[#0070F3]/50 transition-colors placeholder:text-white/30"
                />
                <input
                  type="number"
                  placeholder="Preço alvo (R$/dia)"
                  min="1"
                  value={alertPrice}
                  onChange={e => setAlertPrice(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#050505] px-3 py-2.5 text-sm text-white outline-none focus:border-[#0070F3]/50 transition-colors placeholder:text-white/30"
                />
                <select
                  value={alertCategory}
                  onChange={e => setAlertCategory(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#050505] px-3 py-2.5 text-sm text-white outline-none focus:border-[#0070F3]/50 transition-colors"
                >
                  <option value="">Qualquer categoria</option>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <button
                onClick={createAlert}
                disabled={savingAlert || !alertLocation.trim() || !alertPrice}
                className="mt-3 rounded-xl bg-[#0070F3] px-5 py-2.5 text-sm font-semibold hover:bg-[#0060D9] transition-colors disabled:opacity-40"
              >
                {savingAlert ? 'Criando...' : 'Criar alerta'}
              </button>
            </div>

            {/* Alert list */}
            {alerts.length === 0 ? (
              <p className="text-white/40 text-center py-8">Nenhum alerta ativo ainda.</p>
            ) : (
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-4">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <Bell className="h-3.5 w-3.5 text-[#0070F3]" />
                        {alert.location}
                      </p>
                      <p className="text-sm text-white/40 mt-0.5">
                        Meta: <span className="text-white/70">R$ {Number(alert.targetPrice).toFixed(2)}/dia</span>
                        {alert.carCategory && <> · <span className="text-white/70">{CATEGORY_LABELS[alert.carCategory] || alert.carCategory}</span></>}
                      </p>
                    </div>
                    <button onClick={() => removeAlert(alert.id)} className="text-white/30 hover:text-red-400 transition-colors ml-4">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
