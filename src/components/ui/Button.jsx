const variantMap = {
  primary: 'bg-gradient-to-r from-brand-600 to-brand-700 text-white hover:from-brand-700 hover:to-brand-700 hover:shadow-md active:scale-[0.99]',
  secondary: 'bg-white/90 text-slate-700 border border-slate-300 hover:bg-slate-50 active:scale-[0.99]',
  danger: 'bg-gradient-to-r from-danger to-red-700 text-white hover:from-red-700 hover:to-red-700 hover:shadow-md active:scale-[0.99]',
}

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  className = '',
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100 ${variantMap[variant]} ${className}`}
      {...props}
    >
      {loading ? 'Please wait...' : children}
    </button>
  )
}
