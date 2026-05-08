import { useEffect, useState } from 'react'
import EmptyState from '../components/common/EmptyState'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { Skeleton } from '../components/ui/Loader'
import Modal from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { projectService } from '../services/projectService'
import { userService } from '../services/userService'

export default function ProjectsPage() {
  const { user } = useAuth()
  const { showError, showSuccess } = useToast()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [memberOpen, setMemberOpen] = useState(false)
  const [name, setName] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedProjectMembers, setSelectedProjectMembers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')

  const loadProjects = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await projectService.getProjects()
      setProjects(data?.projects || [])
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to load projects'
      setError(message)
      showError(message)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (!memberOpen) return
    const loadUsers = async () => {
      setUsersLoading(true)
      try {
        const data = await userService.getUsers(userSearch)
        setUsers(data?.users || [])
      } catch (err) {
        const message = err?.response?.data?.message || 'Unable to load users'
        setError(message)
        showError(message)
      } finally {
        setUsersLoading(false)
      }
    }
    loadUsers()
  }, [memberOpen, userSearch])

  const handleCreate = async () => {
    if (!name.trim()) {
      const message = 'Project name is required'
      setError(message)
      showError(message)
      return
    }
    setCreating(true)
    setError('')
    try {
      const data = await projectService.createProject({ name })
      const created = data?.project
      if (!created) {
        setError('Unable to create project')
        return
      }
      setName('')
      setOpen(false)
      await loadProjects()
      showSuccess('Project created')
    } catch (err) {
      const message =
        err?.response?.status === 403
          ? 'Only admin can create projects'
          : err?.response?.data?.message || 'Unable to create project'
      setError(message)
      showError(message)
    } finally {
      setCreating(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedProjectId || !selectedUserId) {
      const message = 'Select a member to add'
      setError(message)
      showError(message)
      return
    }
    const selectedUser = users.find((candidate) => String(candidate._id) === String(selectedUserId))
    if (!selectedUser?.email) return
    setAddingMember(true)
    setError('')
    try {
      await projectService.addMember(selectedProjectId, selectedUser.email)
      setSelectedProjectId('')
      setSelectedProjectMembers([])
      setSelectedUserId('')
      setUserSearch('')
      setMemberOpen(false)
      await loadProjects()
      showSuccess('Member added to project')
    } catch (err) {
      const message =
        err?.response?.status === 403
          ? 'Only admin can add project members'
          : err?.response?.data?.message || 'Unable to add member'
      setError(message)
      showError(message)
    } finally {
      setAddingMember(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        {user?.role === 'admin' && <Button onClick={() => setOpen(true)}>Create project</Button>}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          message="Start by creating your first project."
          actionLabel={user?.role === 'admin' ? 'Create project' : undefined}
          onAction={user?.role === 'admin' ? () => setOpen(true) : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id || project._id}>
              <p className="text-lg font-semibold text-slate-900">{project.name}</p>
              <p className="mt-2 text-sm text-slate-500">Members: {project.membersCount || 0}</p>
              <p className="text-sm text-slate-500">Tasks: {project.taskCount || 0}</p>
              {user?.role === 'admin' && (
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => {
                    setSelectedProjectId(project.id || project._id)
                    setSelectedProjectMembers(project.members || [])
                    setSelectedUserId('')
                    setUserSearch('')
                    setMemberOpen(true)
                  }}
                >
                  Add Member
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={open}
        title="Create Project"
        onClose={() => setOpen(false)}
        onSubmit={handleCreate}
        submitText={creating ? 'Creating...' : 'Create'}
        loading={creating}
        submitDisabled={!name.trim()}
      >
        <Input label="Project name" value={name} onChange={(e) => setName(e.target.value)} />
      </Modal>

      <Modal
        isOpen={memberOpen}
        title="Add Project Member"
        onClose={() => setMemberOpen(false)}
        onSubmit={handleAddMember}
        submitText={addingMember ? 'Adding...' : 'Add member'}
        loading={addingMember}
        submitDisabled={!selectedProjectId || !selectedUserId}
      >
        <Input label="Search member" placeholder="Search by name or email" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Select member</label>
          <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2">
            {usersLoading ? (
              <p className="px-2 py-2 text-sm text-slate-500">Loading members...</p>
            ) : users.length === 0 ? (
              <p className="px-2 py-2 text-sm text-slate-500">No users found</p>
            ) : (
              users.map((candidate) => {
                const alreadyMember = selectedProjectMembers.some(
                  (projectMember) => String(projectMember._id || projectMember.id) === String(candidate._id),
                )
                return (
                  <button
                    key={candidate._id}
                    type="button"
                    disabled={alreadyMember}
                    onClick={() => {
                      setSelectedUserId(candidate._id)
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                      alreadyMember
                        ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                        : selectedUserId === candidate._id
                          ? 'bg-brand-50 text-brand-700'
                          : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{candidate.name}</p>
                      <p className="text-xs text-slate-500">{candidate.email}</p>
                    </div>
                    {alreadyMember && <span className="text-xs font-medium">Added</span>}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
