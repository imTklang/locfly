import { Heart, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import type { CarOffer } from '../hooks/useSearch'

const CATEGORY_LABELS: Record<string, string> = {
  ECONOMICO: 'Econômico',
  INTERMEDIARIO: 'Intermediário',
  SUV: 'SUV',
  LUXO: 'Luxo',
  VAN: 'Van',
}

const PROVIDER_COLORS: Record<string, string> = {
  MOVIDA: 'bg-blue-500/20 text-blue-300',
  UNIDAS: 'bg-orange-500/20 text-orange-300',
  FOCO: 'bg-purple-500/20 text-purple-300',
}

interface CarOfferCardProps {
  offer: CarOffer
  days: number
  isBookmarked?: boolean
  onBookmark?: (id: string) => void
}

export function CarOfferCard({ offer, days, isBookmarked = false, onBookmark }: CarOfferCardProps) {
  const totalPrice = (Number(offer.price) * days).toFixed(2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:border-white/20 transition-all"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-[#111]">
        {offer.imageUrl ? (
          <img
            src={offer.imageUrl}
            alt={offer.model}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/10 text-4xl">
            🚗
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {onBookmark && (
          <button
            onClick={() => onBookmark(offer.id!)}
            className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all ${
              isBookmarked
                ? 'bg-red-500 text-white'
                : 'bg-black/40 text-white/70 hover:text-white'
            }`}
          >
            <Heart className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        )}

        <span
          className={`absolute bottom-3 left-3 rounded-full px-2 py-0.5 text-xs font-semibold ${
            PROVIDER_COLORS[offer.provider] ?? 'bg-white/20 text-white'
          }`}
        >
          {offer.provider}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold">{offer.model}</h3>
            <p className="text-xs text-white/40">
              {CATEGORY_LABELS[offer.category] ?? offer.category}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[#0070F3]">
              R$ {Number(offer.price).toFixed(2)}
            </p>
            <p className="text-xs text-white/40">por dia</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 text-xs text-white/50">
          {offer.transmission && (
            <span className="rounded-full border border-white/10 px-2 py-0.5">
              {offer.transmission}
            </span>
          )}
          {offer.hasAC && (
            <span className="rounded-full border border-white/10 px-2 py-0.5">Ar-cond.</span>
          )}
          {offer.seats && (
            <span className="rounded-full border border-white/10 px-2 py-0.5">
              {offer.seats} lugares
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-white/60 font-medium">
            Total: <span className="text-white">R$ {totalPrice}</span>
          </p>
          <a
            href={offer.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-[#0070F3] px-4 py-2 text-xs font-semibold hover:bg-[#0060D9] transition-colors"
          >
            Reservar <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </motion.div>
  )
}
