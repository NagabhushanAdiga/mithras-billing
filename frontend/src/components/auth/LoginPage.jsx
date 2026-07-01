import {
  HiOutlineLightningBolt,
  HiOutlineCube,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import { IoStorefront } from 'react-icons/io5'
import LoginForm from './LoginForm'
import { Shimmer, ShimmerLine } from '../common/Shimmer'
import { usePageLoading } from '../../hooks/usePageLoading'

const FEATURES = [
  {
    icon: HiOutlineLightningBolt,
    title: 'Fast POS billing',
    description: 'Scan barcodes, add items, and print invoices in seconds.',
  },
  {
    icon: HiOutlineCube,
    title: 'Products & inventory',
    description: 'Organize stock with categories and images.',
  },
  {
    icon: HiOutlineChartBar,
    title: 'Sales reports',
    description: 'Track revenue, filter sales, and export to Excel.',
  },
  {
    icon: HiOutlineUserGroup,
    title: 'Team roles',
    description: 'Admin, manager, and cashier access with secure logins.',
  },
]

function LoginSkeleton() {
  return (
    <div className="w-full space-y-5">
      <Shimmer className="h-11 w-full rounded-md" />
      <Shimmer className="h-11 w-full rounded-md" />
      <Shimmer className="h-12 w-full rounded-md" />
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <ShimmerLine className="h-3 w-40 mx-auto" />
        <div className="flex justify-center gap-2">
          <Shimmer className="h-8 w-16 rounded-md" />
          <Shimmer className="h-8 w-16 rounded-md" />
          <Shimmer className="h-8 w-20 rounded-md" />
        </div>
      </div>
    </div>
  )
}

function BrandMark({ className = '' }) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="flex items-center justify-center w-12 h-12 rounded-md bg-white/15 backdrop-blur-sm text-white shadow-lg ring-1 ring-white/25">
        <IoStorefront className="w-7 h-7" />
      </div>
      <div>
        <p className="text-white font-extrabold text-xl tracking-tight leading-tight">SuperMart Billing</p>
        <p className="text-violet-100 text-sm font-medium">Smart store management</p>
      </div>
    </div>
  )
}

function LoginHero() {
  return (
    <div className="relative flex flex-col justify-between h-full p-10 xl:p-14 text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/3 -right-16 w-80 h-80 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 w-96 h-96 rounded-full bg-indigo-500/25 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="relative z-10">
        <BrandMark />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center py-10 max-w-lg">
        <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
          Run your store with
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-sky-200 to-fuchsia-200">
            speed and clarity
          </span>
        </h1>
        <p className="mt-4 text-violet-100 text-base leading-relaxed">
          Everything you need for daily billing — from the counter to reports — in one colourful, easy-to-use workspace.
        </p>

        <ul className="mt-10 space-y-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-md bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                <Icon className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <p className="font-bold text-sm">{title}</p>
                <p className="text-violet-100/90 text-sm mt-0.5 leading-snug">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 flex items-center gap-2 text-violet-100/90 text-sm">
        <HiOutlineShieldCheck className="w-5 h-5 text-emerald-200 shrink-0" />
        <span>Secure sign-in for your team</span>
      </div>
    </div>
  )
}

export default function LoginPage({ onSuccess }) {
  const loading = usePageLoading(true, 400)

  return (
    <div className="login-shell min-h-screen flex flex-col lg:flex-row">
      {/* Left — brand & features (desktop) */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700">
        <LoginHero />
      </div>

      {/* Mobile hero strip */}
      <div className="lg:hidden bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 px-6 py-8 text-white">
        <BrandMark />
        <p className="mt-4 text-violet-100 text-sm leading-relaxed max-w-md">
          Fast POS billing, inventory, and reports — all in one place.
        </p>
      </div>

      {/* Right — login */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-slate-500 mt-2 text-sm sm:text-base">
              Sign in to your account to open the dashboard and start billing.
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/60 ring-1 ring-slate-100">
            {loading ? <LoginSkeleton /> : <LoginForm onSuccess={onSuccess} />}
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            © {new Date().getFullYear()} SuperMart Billing · Built for retail teams
          </p>
        </div>
      </div>
    </div>
  )
}
