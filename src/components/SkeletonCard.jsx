export function SkeletonLine({ className = '' }) {
  return <div className={`skeleton h-3 rounded ${className}`} />
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`card space-y-3 ${className}`}>
      <div className="skeleton h-4 rounded w-2/5" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3 rounded ${i === lines - 1 ? 'w-3/5' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonMetricCard() {
  return (
    <div className="card">
      <div className="skeleton h-3 w-1/3 rounded mb-3" />
      <div className="skeleton h-7 w-1/4 rounded mb-1" />
      <div className="skeleton h-3 w-2/5 rounded" />
    </div>
  )
}

export function SkeletonAvatar({ size = 8 }) {
  return <div className={`skeleton rounded-full w-${size} h-${size}`} />
}
