import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/common/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { Skeleton } from '../components/ui/Loader'
import Modal from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { projectService } from '../services/projectService'
import { taskService } from '../services/taskService'

const statusFilters = ['all', 'completed', 'pending', 'overdue']
const priorityFilters = ['all', 'low', 'medium', 'high']

export default function TasksPage() {
  const { user } = useAuth()
  const { showError, showSuccess } = useToast()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [assigneeOpen, setAssigneeOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    project: '',
    assignedTo: [],
    dueDate: '',
    priority: 'medium',
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const query = {
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
          ...(priorityFilter !== 'all' ? { priority: priorityFilter } : {}),
          ...(projectFilter !== 'all' ? { project: projectFilter } : {}),
        }
        const [taskData, projectData] = await Promise.all([taskService.getTasks(query), projectService.getProjects()])
        const taskList = taskData?.tasks || []
        setTasks(taskList)
        setProjects(projectData?.projects || [])
      } catch (err) {
        const message = err?.response?.data?.message || 'Unable to load tasks'
        setError(message)
        showError(message)
        setTasks([])
      } finally {
        setLoading(false)
      }
    }
    const timeoutId = setTimeout(load, 180)
    return () => clearTimeout(timeoutId)
  }, [search, statusFilter, priorityFilter, projectFilter])

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id || project._id) === form.project),
    [projects, form.project],
  )

  const availableMembers = useMemo(() => {
    if (!selectedProject) return []
    return (selectedProject.members || []).filter((member) => member?.role === 'member')
  }, [selectedProject])

  const filteredMembers = useMemo(() => {
    const q = assigneeSearch.trim().toLowerCase()
    if (!q) return availableMembers
    return availableMembers.filter((member) => {
      const name = String(member?.name || '').toLowerCase()
      const email = String(member?.email || '').toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  }, [assigneeSearch, availableMembers])

  const selectedAssignees = useMemo(() => {
    const selected = new Set((form.assignedTo || []).map((v) => String(v)))
    return availableMembers.filter((m) => selected.has(String(m._id || m.id)))
  }, [form.assignedTo, availableMembers])

  const handleCreateTask = async () => {
    if (!form.title.trim() || !form.project || (form.assignedTo || []).length === 0 || !form.dueDate || !form.priority) {
      const message = 'Title, project, assignee, due date and priority are required'
      setError(message)
      showError(message)
      return
    }
    if (Number.isNaN(new Date(form.dueDate).getTime())) {
      const message = 'Invalid due date'
      setError(message)
      showError(message)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const data = await taskService.createTask(form)
      if (data?.task) {
        setTasks((prev) => [...prev, data.task].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)))
      }
      setForm({ title: '', description: '', project: '', assignedTo: [], dueDate: '', priority: 'medium' })
      setAssigneeSearch('')
      setAssigneeOpen(false)
      setOpen(false)
      showSuccess('Task created')
      window.dispatchEvent(new Event('dashboard:refresh'))
    } catch (err) {
      const message =
        err?.response?.status === 403
          ? 'Only admin can assign tasks'
          : err?.response?.data?.message || 'Unable to create task'
      setError(message)
      showError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (taskId, nextStatus) => {
    try {
      await taskService.updateTask(taskId, { status: nextStatus })
      setTasks((prev) =>
        prev.map((task) => (String(task.id || task._id) === String(taskId) ? { ...task, status: nextStatus } : task)),
      )
      showSuccess('Task status updated')
      window.dispatchEvent(new Event('dashboard:refresh'))
    } catch (err) {
      const message =
        err?.response?.status === 403
          ? 'You can only update your assigned tasks'
          : err?.response?.data?.message || 'Unable to update task status'
      setError(message)
      showError(message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`rounded-xl px-3 py-1.5 text-sm capitalize transition ${statusFilter === filter ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              {filter}
            </button>
          ))}
          {user?.role === 'admin' && (
            <Button variant="secondary" onClick={() => setOpen(true)}>
              Assign Task
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input placeholder="Search by title..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="all">All projects</option>
          {projects.map((project) => (
            <option key={project.id || project._id} value={project.id || project._id}>
              {project.name}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm capitalize outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          {priorityFilters.map((priority) => (
            <option key={priority} value={priority}>
              {priority === 'all' ? 'All priorities' : `${priority} priority`}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setSearch('')
            setStatusFilter('all')
            setPriorityFilter('all')
            setProjectFilter('all')
          }}
          className="rounded-xl border bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Reset filters
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No tasks in this filter"
              message="Try another status filter or add a new task."
              actionLabel={user?.role === 'admin' ? 'Assign Task' : undefined}
              onAction={user?.role === 'admin' ? () => setOpen(true) : undefined}
            />
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {tasks.map((task) => (
              <div
                key={task.id || task._id}
                className={`rounded-xl border p-4 text-sm transition hover:shadow-sm ${task.status === 'overdue' ? 'border-red-200 bg-red-50/60' : 'bg-white'}`}
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.projectName || 'No project'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={task.status} />
                    <Badge type="priority" priority={task.priority} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <p>
                    Assignee:{' '}
                    {Array.isArray(task.assignees) && task.assignees.length
                      ? task.assignees.map((a) => a.name || a.email).filter(Boolean).join(', ')
                      : 'Unassigned'}
                  </p>
                  <p>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {task.status !== 'completed' && (
                    <button
                      onClick={() =>
                        handleStatusUpdate(task.id || task._id, task.status === 'pending' || task.status === 'overdue' ? 'completed' : 'pending')
                      }
                      className="rounded-lg border px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
                    >
                      Mark done
                    </button>
                  )}
                  {task.status === 'completed' && user?.role === 'admin' && (
                    <button
                      onClick={() => handleStatusUpdate(task.id || task._id, 'pending')}
                      className="rounded-lg border px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
                    >
                      Mark pending
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={open}
        title="Create Task"
        onClose={() => setOpen(false)}
        onSubmit={handleCreateTask}
        submitText={submitting ? 'Creating...' : 'Create'}
        loading={submitting}
        submitDisabled={!form.title.trim() || !form.project || (form.assignedTo || []).length === 0 || !form.dueDate || !form.priority}
      >
        <Input label="Title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
        <Input
          label="Description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Project</label>
          <select
            value={form.project}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, project: e.target.value, assignedTo: [] }))
              setAssigneeSearch('')
              setAssigneeOpen(false)
            }}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id || project._id} value={project.id || project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Assign members</label>

          <div className="rounded-xl border border-slate-300 bg-white p-2 transition-all duration-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
            <div className="flex flex-wrap gap-2">
              {selectedAssignees.map((m) => {
                const id = m._id || m.id
                return (
                  <span key={id} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                    {m.name}
                    <button
                      type="button"
                      className="rounded-full px-1 text-slate-500 transition hover:text-slate-700"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          assignedTo: (prev.assignedTo || []).filter((v) => String(v) !== String(id)),
                        }))
                      }
                      aria-label="Remove member"
                    >
                      ×
                    </button>
                  </span>
                )
              })}
              <input
                value={assigneeSearch}
                onChange={(e) => {
                  setAssigneeSearch(e.target.value)
                  setAssigneeOpen(true)
                }}
                onFocus={() => setAssigneeOpen(true)}
                placeholder={selectedAssignees.length ? 'Add more...' : 'Search by name or email'}
                className="min-w-[160px] flex-1 bg-transparent px-2 py-1 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {assigneeOpen && (
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              {!selectedProject ? (
                <p className="px-2 py-2 text-sm text-slate-500">Select a project first</p>
              ) : filteredMembers.length === 0 ? (
                <p className="px-2 py-2 text-sm text-slate-500">No members found</p>
              ) : (
                filteredMembers.map((member) => {
                  const id = member._id || member.id
                  const selected = (form.assignedTo || []).some((v) => String(v) === String(id))
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={selected}
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          assignedTo: selected ? prev.assignedTo : [...(prev.assignedTo || []), id],
                        }))
                        setAssigneeSearch('')
                        setAssigneeOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                        selected ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                      {selected && <span className="text-xs font-medium">Selected</span>}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
        <Input
          label="Due date"
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm capitalize outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </Modal>
    </div>
  )
}
