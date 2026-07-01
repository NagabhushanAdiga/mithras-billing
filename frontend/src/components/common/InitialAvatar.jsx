const AVATAR_GRADIENTS = [
  'from-violet-500 to-fuchsia-600',
  'from-sky-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
]

export function avatarGradient(name = '') {
  const code = String(name)
    .split('')
    .reduce((sum, c) => sum + c.charCodeAt(0), 0)
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length]
}

export function nameInitial(name, fallback = '?') {
  const trimmed = String(name || '').trim()
  if (!trimmed) return fallback
  return trimmed.charAt(0).toUpperCase()
}

const SIZES = {
  sm: 'w-10 h-10 text-base',
  md: 'w-11 h-11 text-lg',
}

export default function InitialAvatar({ name, fallback = '?', size = 'md', className = '' }) {
  const label = String(name || '').trim() || fallback
  const initial = nameInitial(name, fallback)
  const gradient = avatarGradient(label)
  const sizeClass = SIZES[size] || SIZES.md

  return (
    <div
      className={`shrink-0 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold ${sizeClass} ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  )
}
