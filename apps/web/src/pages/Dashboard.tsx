import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Heart, Bell, LogOut, ExternalLink, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
}

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<CarOffer[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tab, setTab] = useState<'bookmarks' | 'alerts'>('bookmarks');

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
  }

  async function removeAlert(id: string) {
    await fetch(`${API}/api/alerts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setAlerts(a => a.filter(x => x.id !== id));
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
              {t === 'bookmarks' ? <><Heart className="h-4 w-4" /> Favoritos ({bookmarks.length})</> : <><Bell className="h-4 w-4" /> Alertas ({alerts.length})</>}
            </button>
          ))}
        </div>

        {tab === 'bookmarks' && (
          bookmarks.length === 0
            ? <p className="text-white/40 py-16 text-center">Nenhum favorito ainda. <Link to="/" className="text-[#0070F3] hover:underline">Buscar carros</Link></p>
            : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarks.map(offer => (
                  <div key={offer.id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                    {offer.imageUrl && <img src={offer.imageUrl} alt={offer.model} className="w-full h-36 object-cover" />}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">{offer.model}</p>
                          <p className="text-xs text-white/40">{offer.provider}</p>
                        </div>
                        <p className="text-[#0070F3] font-bold">R$ {Number(offer.price).toFixed(2)}<span className="text-xs text-white/40">/dia</span></p>
                      </div>
                      <div className="flex gap-2">
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

        {tab === 'alerts' && (
          alerts.length === 0
            ? <p className="text-white/40 py-16 text-center">Nenhum alerta ativo.</p>
            : (
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-4">
                    <div>
                      <p className="font-medium">{alert.location}</p>
                      <p className="text-sm text-white/40">
                        Meta: R$ {Number(alert.targetPrice).toFixed(2)} {alert.carCategory && `· ${alert.carCategory}`}
                      </p>
                    </div>
                    <button onClick={() => removeAlert(alert.id)} className="text-white/30 hover:text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
        )}
      </div>
    </div>
  );
}
