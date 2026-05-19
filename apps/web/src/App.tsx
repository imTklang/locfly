import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Check, ShieldCheck, Lock, ArrowRight, Activity, Zap, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { searchSchema } from './schemas/search';
import './App.css';

function App() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchError, setSearchError] = useState('');

  function handleSearch() {
    const result = searchSchema.safeParse({ location, startDate, endDate });
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      const formErrs = result.error.flatten().formErrors;
      setSearchError(
        errs.location?.[0] ?? errs.startDate?.[0] ?? errs.endDate?.[0] ?? formErrs[0] ?? 'Verifique os campos'
      );
      return;
    }
    setSearchError('');
    const params = new URLSearchParams(result.data);
    navigate(`/search?${params}`);
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] text-[#FAFAFA] selection:bg-brand-blue selection:text-white font-sans overflow-x-hidden flex flex-col">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-b from-[#001d3d] to-transparent blur-[150px] pointer-events-none opacity-60 z-0" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-blue/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#1E1E1E]/50 blur-[120px] pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="fixed top-0 z-50 flex w-full justify-center border-b border-white/5 bg-[#050505]/60 py-5 backdrop-blur-xl transition-all duration-300">
        <div className="flex w-full max-w-7xl items-center justify-between px-6 md:px-12 lg:px-24">
          <Link to="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-[#0055B8] shadow-lg shadow-brand-blue/20 transition-transform group-hover:scale-105">
              <Zap className="text-white h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white/90">LocFly</span>
          </Link>
          <div className="hidden space-x-10 text-base font-medium text-white/50 md:flex">
            <Link to="/search" className="transition-all hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Descobrir</Link>
            <Link to="/search?category=SUV" className="transition-all hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Frota</Link>
            <a href="#features" className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">Benefícios</a>
          </div>
          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-white/70 transition-colors hover:text-white hidden sm:block">
                  Olá, {user?.name?.split(' ')[0] || 'você'}
                </Link>
                <button
                  onClick={() => logout()}
                  className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white/70 transition-all hover:bg-white/10 active:scale-95"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-white/70 transition-colors hover:text-white hidden sm:block">Entrar</Link>
                <Link
                  to="/register"
                  className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-all hover:scale-105 hover:bg-gray-100 shadow-[0_0_15px_rgba(0,112,243,0.3)] hover:shadow-[0_0_20px_rgba(0,112,243,0.5)] active:scale-95"
                >
                  Criar Conta
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative flex flex-col items-center justify-center px-4 pt-44 pb-16 text-center z-10 flex-grow">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center justify-center rounded-full border border-brand-blue/30 bg-brand-blue/5 px-4 py-1.5 text-xs font-semibold text-brand-blue backdrop-blur-md"
          >
            <span className="mr-2 flex h-2 w-2 rounded-full bg-brand-blue animate-pulse" />
            O motor de busca definitivo
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 text-6xl font-extrabold tracking-[-0.02em] sm:text-7xl md:text-8xl lg:text-[100px] leading-[1.1] text-center"
          >
            Vá além com o <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-brand-blue via-[#00A3FF] to-white bg-clip-text text-transparent drop-shadow-sm">
              carro perfeito.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-14 max-w-2xl text-lg text-white/50 md:text-xl font-light leading-relaxed text-center"
          >
            Uma experiência de locação reimaginada. Compare preços, escolha entre categorias premium e reserve em segundos com total transparência.
          </motion.p>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mx-auto w-full max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-3 shadow-2xl backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div className="grid grid-cols-1 gap-2 md:grid-cols-4 items-center">
              <div className="flex items-center rounded-[1.5rem] px-4 py-3 transition-colors hover:bg-white/5 group border border-transparent hover:border-white/5">
                <MapPin className="text-white/30 group-hover:text-brand-blue transition-colors mr-3" size={24} />
                <div className="flex flex-col flex-1 text-left">
                  <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white/80 transition-colors">Onde</span>
                  <input
                    type="text"
                    placeholder="Cidade ou aeroporto"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-transparent text-base font-medium text-white outline-none placeholder:text-white/40"
                  />
                </div>
              </div>

              <div className="flex items-center rounded-[1.5rem] px-4 py-3 transition-colors hover:bg-white/5 group border border-transparent hover:border-white/5 md:border-l border-white/5">
                <Calendar className="text-white/30 group-hover:text-brand-blue transition-colors mr-3" size={24} />
                <div className="flex flex-col flex-1 text-left">
                  <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white/80 transition-colors">Retirada</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-transparent text-base font-medium text-white outline-none [&::-webkit-calendar-picker-indicator]:invert opacity-80"
                  />
                </div>
              </div>

              <div className="flex items-center rounded-[1.5rem] px-4 py-3 transition-colors hover:bg-white/5 group border border-transparent hover:border-white/5 md:border-l border-white/5">
                <Calendar className="text-white/30 group-hover:text-brand-blue transition-colors mr-3" size={24} />
                <div className="flex flex-col flex-1 text-left">
                  <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white/80 transition-colors">Devolução</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-transparent text-base font-medium text-white outline-none [&::-webkit-calendar-picker-indicator]:invert opacity-80"
                  />
                </div>
              </div>

              <div className="h-full p-1">
                <button
                  onClick={handleSearch}
                  className="flex h-full min-h-[60px] w-full items-center justify-center rounded-[1.5rem] font-bold transition-all duration-300 bg-white text-black hover:scale-[1.02] hover:bg-brand-blue hover:text-white hover:shadow-[0_0_30px_rgba(0,112,243,0.4)] active:scale-95 text-lg"
                >
                  Procurar
                </button>
              </div>
            </div>
            {searchError && (
              <p className="text-center text-sm text-red-400 mt-3 animate-pulse">{searchError}</p>
            )}
          </motion.div>
        </div>
      </main>

      {/* Social Proof - Infinite Slider */}
      <section className="relative z-10 w-full overflow-hidden border-y border-white/5 bg-white/[0.01] py-8 backdrop-blur-sm mt-8">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10" />
        <div className="text-center mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Compare e reserve nas maiores locadoras do Brasil</p>
        </div>
        <div className="flex w-[200%] animate-infinite-slider items-center">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex w-1/2 justify-around items-center px-4">
              <img src="/localiza.png" alt="Localiza" className="h-10 w-auto object-contain opacity-40 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100 cursor-default" />
              <img src="/movida.png" alt="Movida" className="h-10 w-auto object-contain opacity-40 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100 cursor-default" />
              <img src="/unidas.png" alt="Unidas" className="h-10 w-auto object-contain opacity-40 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100 cursor-default" />
              <img src="/foco.png" alt="Foco" className="h-10 w-auto object-contain opacity-40 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100 cursor-default" />
              <img src="/hertz.png" alt="Hertz" className="h-10 w-auto object-contain opacity-40 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100 cursor-default" />
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-24 md:px-12 lg:px-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Inteligência que joga <span className="text-brand-blue">a seu favor</span></h2>
            <p className="text-white/50 max-w-2xl mx-auto">Nossa tecnologia varre o mercado para garantir que você não pague um centavo a mais do que o necessário.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-[2rem] bg-gradient-to-b from-white/[0.05] to-transparent border border-white/5 p-8 transition-all hover:bg-white/[0.08] hover:border-white/10">
              <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center mb-6 border border-brand-blue/20">
                <RefreshCw className="text-brand-blue" />
              </div>
              <h3 className="text-xl font-bold mb-3">Radar em Tempo Real</h3>
              <p className="text-white/50 text-sm leading-relaxed">Consultamos simultaneamente os sistemas de mais de 20 locadoras no instante em que você clica em buscar. Sem cache, sem preços desatualizados.</p>
            </div>
            <div className="rounded-[2rem] bg-gradient-to-b from-white/[0.05] to-transparent border border-white/5 p-8 transition-all hover:bg-white/[0.08] hover:border-white/10">
              <div className="h-12 w-12 rounded-2xl bg-[#00A3FF]/10 flex items-center justify-center mb-6 border border-[#00A3FF]/20">
                <Activity className="text-[#00A3FF]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Alerta de Queda</h3>
              <p className="text-white/50 text-sm leading-relaxed">Defina um preço alvo. Nossa IA monitora o mercado 24/7 e notifica você imediatamente quando o preço da categoria desejada cair.</p>
            </div>
            <div className="rounded-[2rem] bg-gradient-to-b from-white/[0.05] to-transparent border border-white/5 p-8 transition-all hover:bg-white/[0.08] hover:border-white/10">
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <ShieldCheck className="text-white/80" />
              </div>
              <h3 className="text-xl font-bold mb-3">Reserva Garantida</h3>
              <p className="text-white/50 text-sm leading-relaxed">Preço transparente e sem surpresas no balcão. O valor que você vê na plataforma é o valor final da locação.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="relative z-10 px-6 py-12 md:px-12 lg:px-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Destaques <span className="text-white/40 font-light">da semana</span></h2>
            </div>
            <Link to="/search" className="group flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white">
              Explorar frota
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid h-auto grid-cols-1 gap-6 md:h-[600px] md:grid-cols-3 md:grid-rows-2">
            <div className="group relative overflow-hidden rounded-[2rem] bg-[#111] border border-white/5 md:col-span-2 md:row-span-2 transition-transform duration-500 hover:border-white/10 min-h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-10" />
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-60" />
              <div className="absolute inset-0 z-20 flex flex-col justify-between p-10">
                <div className="flex justify-between items-start">
                  <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold backdrop-blur-md">SUV PREMIUM</span>
                  <Link to="/search?category=LUXO" className="rounded-full bg-white/10 p-3 backdrop-blur-md transition-colors hover:bg-white hover:text-black">
                    <ArrowRight className="h-5 w-5 -rotate-45" />
                  </Link>
                </div>
                <div>
                  <h3 className="mb-2 text-4xl font-bold tracking-tight text-white drop-shadow-lg">Mercedes-Benz GLC</h3>
                  <p className="text-3xl font-light text-brand-blue">R$ 450<span className="text-lg text-white/50">/dia</span></p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-[2rem] bg-[#111] border border-white/5 transition-transform duration-500 hover:border-white/10 min-h-[250px]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent z-10" />
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-60" />
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-8">
                <span className="mb-2 w-fit rounded-full bg-brand-blue/20 px-3 py-1 text-[10px] font-bold text-brand-blue border border-brand-blue/30 backdrop-blur-md">ECONÔMICO</span>
                <h3 className="text-2xl font-bold">Chevrolet Onix</h3>
                <p className="text-white/60 mt-1">A partir de R$ 90/dia</p>
              </div>
            </div>
            <Link to="/search" className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/5 transition-transform duration-500 hover:border-white/10 min-h-[250px] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 to-transparent z-0" />
              <div className="z-10 text-center p-8 group-hover:scale-105 transition-transform duration-500">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  <ArrowRight className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Ver todas as categorias</h3>
                <p className="text-sm text-white/50">Descubra mais de 500 modelos disponíveis.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#020202] pt-20 pb-10 mt-auto">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-8 lg:gap-12">
            <div className="flex flex-col items-start md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-blue to-[#0055B8]">
                  <Zap className="text-white h-4 w-4" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white/90">LocFly</span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed mb-6">O motor de busca inteligente que revoluciona a forma como você aluga carros no Brasil.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-6 tracking-wider">PRODUTO</h4>
              <ul className="flex flex-col gap-4 text-sm text-white/50">
                <li><Link to="/search" className="hover:text-brand-blue transition-colors">Buscar carros</Link></li>
                <li><Link to="/search?category=LUXO" className="hover:text-brand-blue transition-colors">Frota Premium</Link></li>
                <li><Link to="/search?category=ECONOMICO" className="hover:text-brand-blue transition-colors">Econômicos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-6 tracking-wider">CONTA</h4>
              <ul className="flex flex-col gap-4 text-sm text-white/50">
                <li><Link to="/register" className="hover:text-brand-blue transition-colors">Criar conta</Link></li>
                <li><Link to="/login" className="hover:text-brand-blue transition-colors">Entrar</Link></li>
                <li><Link to="/dashboard" className="hover:text-brand-blue transition-colors">Meus favoritos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-6 tracking-wider">LEGAL</h4>
              <ul className="flex flex-col gap-4 text-sm text-white/50 mb-8">
                <li><a href="#" className="hover:text-brand-blue transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Privacidade</a></li>
              </ul>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-white/70">
                  <Lock size={14} className="text-green-400" />
                  <span className="text-xs font-medium">Conexão Segura SSL</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Check size={14} className="text-brand-blue" />
                  <span className="text-xs font-medium">Dados Criptografados</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/30">
            <p>© 2026 LocFly Inc. Todos os direitos reservados.</p>
            <p>Feito com tecnologia e precisão.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
