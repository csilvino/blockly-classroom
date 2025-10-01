
import create from 'zustand'
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:3001/api', withCredentials: true })

export const useSessionStore = create((set,get)=>({
  user: null,
  async login(email, password){
    const { data } = await api.post('/auth/login', { email, password })
    set({ user: data })
  },
  async register(name, email, password, role){
    const { data } = await api.post('/auth/register', { name, email, password, role })
    set({ user: data })
  },
  logout(){ set({ user:null }); api.post('/auth/logout') },
  api,
}))
