import { useEffect, useState } from 'react'
import EmptyState from '../components/common/EmptyState'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import { Skeleton } from '../components/ui/Loader'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import { taskService } from '../services/taskService'

export default function DashboardPage() {
  const { showError } = useToast()
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [recentlyUpdated, setRecentlyUpdated] = useState([])
  const [summary, setSummary] = useState({ total: 0, completed: 0, pending: 0, overdue: 0, dueToday: 0, myTasks: 0 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [taskData, summaryData] = await Promise.all([taskService.getTasks(), taskService.getDashboard()])
        setTasks(taskData?.tasks || [])
        setSummary({
          total: summaryData?.total || 0,
          completed: summaryData?.completed || 0,
          pending: summaryData?.pending || 0,
          overdue: summaryData?.overdue || 0,
          dueToday: summaryData?.dueToday || 0,
          myTasks: summaryData?.myTasks || 0,
        })
        setRecentlyUpdated(summaryData?.recentlyUpdated || [])
      } catch (err) {
        const message = err?.response?.data?.message || 'Unable to load dashboard data'
        setError(message)
        showError(message)
        setTasks([])
        setRecentlyUpdated([])
        setSummary({ total: 0, completed: 0, pending: 0, overdue: 0, dueToday: 0, myTasks: 0 })
      } finally {
        setLoading(false)
      }
    }

    const handleRefresh = () => load()

    load()
    window.addEventListener('dashboard:refresh', handleRefresh)

    return () => {
      window.removeEventListener('dashboard:refresh', handleRefresh)
    }
  }, [])

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="space-y-1">
        <h1>Dashboard</h1>
        <p className="text-sm text-slate-600 md:text-base">Track team progress and task delivery at a glance.</p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {(() => {
        const isAdmin = user?.role === 'admin'
        const items = isAdmin
          ? [
              { key: 'total', label: 'TOTAL TASKS', value: summary.total },
              { key: 'completed', label: 'COMPLETED', value: summary.completed },
              { key: 'pending', label: 'PENDING', value: summary.pending },
              { key: 'overdue', label: 'OVERDUE', value: summary.overdue },
              { key: 'dueToday', label: 'DUE TODAY', value: summary.dueToday },
            ]
          : [
              { key: 'myTasks', label: 'MY TASKS', value: summary.total },
              { key: 'completed', label: 'MY COMPLETED', value: summary.completed },
              { key: 'pending', label: 'MY PENDING', value: summary.pending },
              { key: 'overdue', label: 'MY OVERDUE', value: summary.overdue },
              { key: 'dueToday', label: 'MY DUE TODAY', value: summary.dueToday },
            ]

        return (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
              : items.map((item) => (
                  <Card key={item.key}>
                    <p className="text-xs font-medium tracking-wide text-slate-500">{item.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{item.value}</p>
                  </Card>
                ))}
          </div>
        )
      })()}

      <Card>
        <h2 className="mb-4">{user?.role === 'admin' ? 'Recent Tasks (Team)' : 'Recent Tasks (Mine)'}</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState title="No tasks yet" message="Tasks will appear here once they’re created and assigned." />
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-xl border p-3.5 transition hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-800 md:text-base">{task.title}</p>
                  <p className="text-sm text-slate-500">
                    {user?.role === 'admin'
                      ? Array.isArray(task.assignees) && task.assignees.length
                        ? task.assignees.map((a) => a.name || a.email).filter(Boolean).join(', ')
                        : 'Unassigned'
                      : task.projectName || 'No project'}
                  </p>
                </div>
                <Badge status={task.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-4">{user?.role === 'admin' ? 'Recently Updated (Team)' : 'Recently Updated (Mine)'}</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : recentlyUpdated.length === 0 ? (
          <EmptyState title="No recent updates" message="Task updates will appear here." />
        ) : (
          <div className="space-y-3">
            {recentlyUpdated.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-xl border p-3.5 transition hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-800 md:text-base">{task.title}</p>
                  <p className="text-sm text-slate-500">{user?.role === 'admin' ? task.projectName || 'No project' : task.projectName || 'No project'}</p>
                </div>
                <Badge status={task.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
