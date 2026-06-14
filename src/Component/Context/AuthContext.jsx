import { createContext, useContext, useState, useEffect, useCallback } from "react"
import axios from "axios"
import { API_URL } from "../Authentication/Authentication"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  const isTokenExpired = (tkn) => {
    try {
      const payload = JSON.parse(atob(tkn.split(".")[1]))
      return Date.now() >= payload.exp * 1000
    } catch {
      return true
    }
  }

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
    localStorage.removeItem("mode")
    setToken(null)
    setUser(null)
  }, [])

  const refreshAccessToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken")
    if (!storedRefreshToken) {
      logout()
      return null
    }
    try {
      const res = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: storedRefreshToken,
      })
      const newToken = res.data.token
      localStorage.setItem("token", newToken)
      setToken(newToken)
      return newToken
    } catch (err) {
      logout()
      return null
    }
  }, [logout])

  // ── safe JSON parse — never crashes on "undefined" or "null" strings ─
  const safeParse = (str) => {
    if (!str || str === "undefined" || str === "null") return null
    try {
      return JSON.parse(str)
    } catch {
      return null
    }
  }

  useEffect(() => {
    const storedToken   = localStorage.getItem("token")
    const storedUser    = localStorage.getItem("user")

    // ── clean up bad values left by old login calls ───────────────────
    if (storedUser === "undefined" || storedUser === "null") {
      localStorage.removeItem("user")
    }
    if (storedToken === "undefined" || storedToken === "null") {
      localStorage.removeItem("token")
    }

    const init = async () => {
      const parsedUser = safeParse(storedUser)

      if (storedToken && parsedUser) {
        if (isTokenExpired(storedToken)) {
          const newToken = await refreshAccessToken()
          if (newToken) {
            setToken(newToken)
            setUser(parsedUser)
          }
        } else {
          setToken(storedToken)
          setUser(parsedUser)
        }
      }
      setLoading(false)
    }

    init()
  }, [refreshAccessToken])

 const login = (token, refreshToken, user) => {
  if (!token || !user) {
    console.error("login() called with missing token or user", { token, user })
    return
  }
  console.log("login() updating user to:", user) // ← add this
  localStorage.setItem("token", token)
  localStorage.setItem("refreshToken", refreshToken || "")
  localStorage.setItem("user", JSON.stringify(user))
  localStorage.removeItem("mode")
  setToken(token)
  setUser(user)
}

  const getValidToken = useCallback(async () => {
    const current = localStorage.getItem("token")
    if (!current || current === "undefined" || isTokenExpired(current)) {
      return await refreshAccessToken()
    }
    return current
  }, [refreshAccessToken])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, getValidToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}