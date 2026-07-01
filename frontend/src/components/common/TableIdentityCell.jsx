import InitialAvatar from './InitialAvatar'
import ProductImage from './ProductImage'

export default function TableIdentityCell({
  title,
  subtitle,
  name,
  product,
  imageSize = 'sm',
  avatarSize = 'md',
  avatarFallback = '?',
  subtitleClassName = 'text-slate-500 text-xs mt-0.5 truncate font-mono',
  className = '',
}) {
  const avatarName = name ?? title ?? '?'

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      {product ? (
        <ProductImage product={product} size={imageSize} />
      ) : (
        <InitialAvatar name={avatarName} fallback={avatarFallback} size={avatarSize} />
      )}
      <div className="min-w-0">
        <p className="text-slate-900 font-semibold text-sm truncate">{title}</p>
        {subtitle ? <p className={subtitleClassName}>{subtitle}</p> : null}
      </div>
    </div>
  )
}
