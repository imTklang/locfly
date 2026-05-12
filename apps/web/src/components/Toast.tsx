import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const ICONS = {
  success: <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />,
  error: <XCircle className="h-4 w-4 text-red-400 shrink-0" />,
  info: <Info className="h-4 w-4 text-[#0070F3] shrink-0" />,
};

let counter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: number) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111] px-4 py-3 shadow-2xl min-w-[220px] max-w-[320px]"
          >
            {ICONS[t.type]}
            <span className="text-sm text-white/90 flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/30 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
