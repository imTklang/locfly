import { Link } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] flex flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        <Link to="/" className="flex items-center gap-2 mb-12">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0070F3] to-[#0055B8]">
            <Zap className="text-white h-5 w-5" />
          </div>
          <span className="text-2xl font-bold text-white/90">LocFly</span>
        </Link>

        <p className="text-8xl font-black text-white/5 select-none mb-4">404</p>
        <h1 className="text-3xl font-bold mb-3">Página não encontrada</h1>
        <p className="text-white/40 mb-10 max-w-sm">Esta rota não existe. Talvez você tenha digitado o endereço errado ou a página foi movida.</p>

        <Link
          to="/"
          className="flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black hover:bg-gray-100 transition-all hover:scale-105"
        >
          Voltar para o início <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}
