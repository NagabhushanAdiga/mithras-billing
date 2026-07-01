import { productImageSrc } from '../../utils/productImage'
import { Shimmer } from './Shimmer'
import { usePendingChanges } from '../../hooks/usePendingChanges'

export default function ProductImage({ product, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-10 h-10 rounded-lg',
    md: 'w-12 h-12 rounded-md',
    lg: 'w-16 h-16 rounded-md',
  }
  const sizeClass = sizes[size] || sizes.md
  const src = productImageSrc(product)
  const name = product?.name || '?'
  const { pendingChanges, patchPendingChanges } = usePendingChanges({ loaded: false, failed: false })
  const { loaded, failed } = pendingChanges

  const imageSrc = failed
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=128`
    : src

  return (
    <div className={`relative shrink-0 ${sizeClass} ${className}`}>
      {!loaded && <Shimmer className={`absolute inset-0 ${sizeClass}`} />}
      <img
        src={imageSrc}
        alt={name}
        onLoad={() => patchPendingChanges({ loaded: true })}
        onError={() => {
          if (!failed) {
            patchPendingChanges({ failed: true, loaded: false })
          }
        }}
        className={`object-cover bg-slate-100 border border-slate-200/80 w-full h-full ${sizeClass} transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
