export default function Card({ children, className = '' }) {
  return (
    <div
      className={`fade-in rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-soft backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl ${className}`}
    >
      {children}
    </div>
  )
}
