export function Spinner() {
  return <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600 shadow-sm" aria-label="Loading" />
}

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] ${className}`}
    />
  )
}
