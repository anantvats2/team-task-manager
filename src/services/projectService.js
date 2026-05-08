import api from './api'

export const projectService = {
  getProjects: async () => {
    const response = await api.get('/projects')
    return response.data
  },
  createProject: async (payload) => {
    const response = await api.post('/projects', payload)
    return response.data
  },
  addMember: async (projectId, email) => {
    const response = await api.put(`/projects/${projectId}/add-member`, { email, action: 'add' })
    return response.data
  },
}
