import axios from 'axios'

const API = axios.create({
  baseURL: 'https://bepc-backend.onrender.com/api'
})

// Ajouter le token automatiquement
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('bepc_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const register = (data) => API.post('/auth/register', data)
export const login = (data) => API.post('/auth/login', data)

// Paiement
export const initiatePayment = (data) => API.post('/payment/initiate', data)
export const checkPaymentStatus = (token) => API.get(`/payment/status/${token}`)

// Abonnement
export const checkSubscription = () => API.get('/subscription/check')

export default API
