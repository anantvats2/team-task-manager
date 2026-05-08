import api from './api'

export const taskService = {
  getTasks: async (params = {}) => {
    const response = await api.get('/tasks', { params })
    return response.data
  },
  createTask: async (payload) => {
    const response = await api.post('/tasks', payload)
    return response.data
  },
  updateTask: async (id, payload) => {
    const response = await api.put(`/tasks/${id}`, payload)
    return response.data
  },
  getDashboard: async () => {
    const response = await api.get('/tasks/dashboard')
    return response.data
  },
}
