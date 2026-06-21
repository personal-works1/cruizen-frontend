import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import axios from "axios"
import { API_URL } from "../Authentication/Authentication"

const AuthContext = createContext()

axios.defaults.withCredentials = true

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const isRefreshing          = useRef(false) // prevent refresh loops

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`)
    } catch (err) {
      console.error("Logout request failed:", err)
    }
    setUser(null)
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/me`)
        setUser(res.data.user)
      } catch {
        try {
          await axios.post(`${API_URL}/auth/refresh`)
          const res = await axios.get(`${API_URL}/auth/me`)
          setUser(res.data.user)
        } catch {
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = (user) => {
    if (!user) {
      console.error("login() called with missing user", { user })
      return
    }
    setUser(user)
  }

  const refreshUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`)
      setUser(res.data.user)
    } catch (err) {
      console.error("refreshUser failed:", err)
    }
  }, [])

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config

        // never retry the refresh endpoint itself
        if (original.url?.includes("/auth/refresh")) return Promise.reject(error)

        if (error.response?.status === 401 && !original._retry && !isRefreshing.current) {
          original._retry    = true
          isRefreshing.current = true
          try {
            await axios.post(`${API_URL}/auth/refresh`)
            return axios(original)
          } catch {
            setUser(null)
            return Promise.reject(error)
          } finally {
            isRefreshing.current = false
          }
        }
        return Promise.reject(error)
      }
    )
    return () => axios.interceptors.response.eject(interceptor)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}