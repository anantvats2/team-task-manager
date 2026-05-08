export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <input
        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:-translate-y-[1px] focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${error ? 'border-danger' : 'border-slate-300'} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
