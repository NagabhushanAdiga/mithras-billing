import Card from './Card'
import { Shimmer, ShimmerCircle, ShimmerLine } from './Shimmer'

function HeaderSkeleton() {
  return (
    <div className="flex items-start gap-4">
      <ShimmerCircle className="w-12 h-12 rounded-md" />
      <div className="flex-1 space-y-2">
        <ShimmerLine className="h-7 w-48 sm:w-64" />
        <ShimmerLine className="h-4 w-full max-w-sm" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-300">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex justify-between gap-3">
              <div className="flex-1 space-y-3">
                <ShimmerLine className="w-24 h-3" />
                <ShimmerLine className="w-20 h-8" />
              </div>
              <Shimmer className="w-11 h-11 rounded-md" />
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-6 sm:p-8 space-y-4">
        <ShimmerLine className="h-6 w-56" />
        <ShimmerLine className="h-4 w-72" />
        <div className="flex flex-wrap gap-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Shimmer key={i} className="h-10 w-32 rounded-md" />
          ))}
        </div>
      </Card>
    </div>
  )
}

export function TablePageSkeleton({ rows = 6 }) {
  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <HeaderSkeleton />
        <Shimmer className="h-10 w-36 rounded-md" />
      </div>
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Shimmer className="h-11 flex-1 rounded-md" />
          <Shimmer className="h-11 w-full sm:w-48 rounded-md" />
        </div>
        <div className="space-y-2">
          <Shimmer className="h-10 w-full rounded-lg" />
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Shimmer className="w-10 h-10 rounded-lg shrink-0" />
              <ShimmerLine className="flex-1 h-4" />
              <ShimmerLine className="w-16 h-4" />
              <ShimmerLine className="w-20 h-4 hidden sm:block" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function PosSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in duration-300">
      <div className="xl:col-span-2 space-y-4">
        <Card className="p-5 sm:p-6 space-y-3">
          <Shimmer className="h-12 w-full rounded-md" />
        </Card>
        <Card className="p-5 sm:p-6 space-y-3">
          <ShimmerLine className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Shimmer className="w-12 h-12 rounded-md" />
              <div className="flex-1 space-y-2">
                <ShimmerLine className="w-3/4" />
                <ShimmerLine className="w-1/2 h-3" />
              </div>
              <Shimmer className="w-24 h-9 rounded-md" />
            </div>
          ))}
        </Card>
      </div>
      <Card className="p-5 space-y-4">
        <Shimmer className="h-36 w-full rounded-md" />
        <Shimmer className="h-28 w-full rounded-md" />
        <Shimmer className="h-11 w-full rounded-md" />
        <div className="flex gap-2">
          <Shimmer className="h-10 flex-1 rounded-md" />
          <Shimmer className="h-10 flex-1 rounded-md" />
        </div>
      </Card>
    </div>
  )
}

export function FormPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-300">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-5 sm:p-6 xl:col-span-2 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <ShimmerLine className="w-28 h-3" />
              <Shimmer className="h-11 w-full rounded-md" />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Shimmer className="h-10 w-32 rounded-md" />
            <Shimmer className="h-10 w-32 rounded-md" />
          </div>
        </Card>
        <Card className="p-5 sm:p-6 space-y-4">
          <ShimmerLine className="w-24 h-5" />
          <Shimmer className="h-48 w-full rounded-md" />
        </Card>
      </div>
    </div>
  )
}

const SKELETON_BY_PATH = {
  '/': DashboardSkeleton,
  '/pos': PosSkeleton,
  '/recent-bills': TablePageSkeleton,
  '/support': FormPageSkeleton,
  '/products': TablePageSkeleton,
  '/categories': TablePageSkeleton,
  '/groups': TablePageSkeleton,
  '/subcategories': TablePageSkeleton,
  '/reports': DashboardSkeleton,
  '/barcodes': FormPageSkeleton,
  '/settings': FormPageSkeleton,
  '/audit': TablePageSkeleton,
  '/team': FormPageSkeleton,
}

export function PageSkeleton({ path = '/' }) {
  const Component = SKELETON_BY_PATH[path] || DashboardSkeleton
  return <Component />
}
