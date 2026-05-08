const statusStyles = {
  completed: 'bg-green-100 text-green-700 ring-1 ring-green-200',
  pending: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200',
  overdue: 'bg-red-100 text-red-700 ring-1 ring-red-200',
}

const priorityStyles = {
  low: 'bg-green-100 text-green-700 ring-1 ring-green-200',
  medium: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200',
  high: 'bg-red-100 text-red-700 ring-1 ring-red-200',
}

export default function Badge({ status, priority, type = 'status' }) {
  const value = type === 'priority' ? priority : status
  const styles = type === 'priority' ? priorityStyles : statusStyles
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize transition-colors duration-200 ${styles[value] || 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'}`}
    >
      {value}
    </span>
  )
}
