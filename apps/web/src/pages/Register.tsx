import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../stores/authStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof registerSchema>, string>>;

interface AuthResponse {
  token: string;
  user: { id: string; name: string | null; email: string };
  error?: string;
}

async function registerRequest(body: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as AuthResponse;
  if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');
  return data;
}

export default function Register() {
  const { login } = useAuth();
  const { setUser, setToken } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const mutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: (data) => {
      login(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
      navigate('/dashboard');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const result = registerSchema.safeParse({ name, email, password });
    if (!result.success) {
      const errs: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    mutation.mutate(result.data);
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
          <h1 className="text-2xl font-bold mb-1">Criar conta</h1>
          <p className="text-white/50 text-sm mb-8">Compare carros de 5 locadoras em segundos</p>

          {mutation.error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {(mutation.error as Error).message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm outline-none transition-all placeholder:text-white/30 ${
                  fieldErrors.name
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-[#0070F3]'
                }`}
                placeholder="Seu nome"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm outline-none transition-all placeholder:text-white/30 ${
                  fieldErrors.email
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-[#0070F3]'
                }`}
                placeholder="seu@email.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm outline-none transition-all placeholder:text-white/30 ${
                  fieldErrors.password
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-[#0070F3]'
                }`}
                placeholder="Mínimo 8 caracteres"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-xl bg-[#0070F3] py-3 text-sm font-semibold transition-all hover:bg-[#0060D9] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar conta
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            Já tem conta?{' '}
            <Link to="/login" className="text-[#0070F3] hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
