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
    const res = await axios.get(`${API_URL}/auth/me`, { timeout: 5000 })
    setUser(res.data.user)
    subscribeToPush()
  } catch {
    try {
      await axios.post(`${API_URL}/auth/refresh`, {}, { timeout: 5000 })
      const res = await axios.get(`${API_URL}/auth/me`, { timeout: 5000 })
      setUser(res.data.user)
      subscribeToPush()
    } catch {
      setUser(null)
    }
  } finally {
    console.log("✅ finally ran") // ← add this
    setLoading(false)
    const splash = document.getElementById("splash")
    console.log("splash el:", splash) // ← and this
    if (splash) {
      splash.classList.add("hidden")
      setTimeout(() => splash.remove(), 400)
    }
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

  const subscribeToPush = useCallback(async () => {
  try {
    // check if browser supports push notifications
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return

    // ask user for permission
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return

    // get the service worker registration
    const registration = await navigator.serviceWorker.ready

    // subscribe to push — this generates the token
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
    })

    // detect device type
    const ua = navigator.userAgent
    let device_type = "desktop"
    if (/tablet|ipad|playbook|silk/i.test(ua)) device_type = "pad"
    else if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) device_type = "mobile"

    // send token to backend
    await axios.post(`${API_URL}/notifications/subscribe`, {
      token: JSON.stringify(subscription),
      device_type
    })

  } catch (error) {
    console.error("Push subscription error:", error)
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