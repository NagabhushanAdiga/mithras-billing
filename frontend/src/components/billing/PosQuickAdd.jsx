import ProductImage from '../common/ProductImage'

const CARD_ACCENTS = 'hover:border-blue-400 hover:bg-blue-50'

const PRICE_COLORS = ['text-emerald-600', 'text-sky-600', 'text-violet-600', 'text-amber-600', 'text-pink-600', 'text-cyan-600', 'text-orange-600', 'text-fuchsia-600']

export default function PosQuickAdd({ products, currency, onAdd, max = 8 }) {
  const picks = products.slice(0, max)
  if (picks.length === 0) return null

  return (
    <div>
      <p className="text-sm font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent mb-3">
        Quick add — tap a product
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {picks.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onAdd(p)}
            className={`flex flex-col items-center gap-2 p-3 rounded-md border-2 border-blue-100 bg-white transition-all text-center group ${CARD_ACCENTS}`}
          >
            <ProductImage product={p} size="md" className="group-hover:scale-110 transition-transform ring-2 ring-white" />
            <span className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">{p.name}</span>
            <span className={`text-xs font-bold ${PRICE_COLORS[i % PRICE_COLORS.length]}`}>{currency}{Number(p.price).toFixed(2)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
