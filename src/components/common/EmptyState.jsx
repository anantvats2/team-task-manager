export default function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <div className="fade-in rounded-2xl border border-dashed border-slate-300 bg-white/90 p-8 text-center shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-400">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">i</div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 rounded-xl border bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
