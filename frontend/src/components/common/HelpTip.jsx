export default function HelpTip({ children, variant = 'info' }) {
  const styles = {
    info: 'bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200 text-sky-900',
    tip: 'bg-gradient-to-r from-violet-50 to-fuchsia-50 border-violet-200 text-violet-900',
    success: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-900',
  }
  return (
    <p className={`text-xs sm:text-sm rounded-md border-2 px-4 py-3 leading-relaxed font-medium ${styles[variant] || styles.info}`}>
      {children}
    </p>
  )
}
