export function Shimmer({ className = '', rounded = 'rounded-md' }) {
  return <div className={`shimmer ${rounded} ${className}`} aria-hidden="true" />
}

export function ShimmerLine({ className = '' }) {
  return <Shimmer className={`h-3 ${className}`} rounded="rounded-md" />
}

export function ShimmerCircle({ className = 'w-10 h-10' }) {
  return <Shimmer className={className} rounded="rounded-full" />
}
