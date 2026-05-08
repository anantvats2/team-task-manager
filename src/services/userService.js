import api from './api'

export const userService = {
  getUsers: async (search = '') => {
    const response = await api.get('/users', { params: { search } })
    return response.data
  },
}
