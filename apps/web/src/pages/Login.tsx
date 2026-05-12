import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erro ao entrar'); return; }
      login(data.token, data.user);
      navigate('/');
    } catch {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] text-[#FAFAFA] flex items-center justify-center px-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-gradient-to-b from-[#001d3d] to-transparent blur-[120px] pointer-events-none opacity-60" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-10 justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0070F3] to-[#0055B8] shadow-lg">
            <Zap className="text-white h-4 w-4" />
          </div>
          <span className="text-xl font-bold text-white/90">LocFly</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
          <h1 className="text-2xl font-bold mb-1">Bem-vindo de volta</h1>
          <p className="text-white/50 text-sm mb-8">Entre na sua conta para continuar</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">E-mail</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#0070F3] focus:bg-white/8 transition-all placeholder:text-white/30"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Senha</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#0070F3] transition-all placeholder:text-white/30"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full rounded-xl bg-[#0070F3] py-3 text-sm font-semibold transition-all hover:bg-[#0060D9] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            Não tem conta?{' '}
            <Link to="/register" className="text-[#0070F3] hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
