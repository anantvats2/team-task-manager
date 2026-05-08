import Button from './Button'

export default function Modal({ isOpen, title, children, onClose, onSubmit, submitText = 'Save', loading = false, submitDisabled = false }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 transition-all duration-200">
      <div className="fade-in flex w-full max-w-md max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-soft backdrop-blur-sm transition-all duration-200">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 transition hover:text-slate-600">
            X
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-5 py-4 [scrollbar-gutter:stable]">
          <div className="space-y-4">{children}</div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200/80 px-5 py-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={loading} disabled={submitDisabled}>
            {submitText}
          </Button>
        </div>
      </div>
    </div>
  )
}
