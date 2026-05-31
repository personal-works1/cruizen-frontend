import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "./AuthContext"

const SocketContext = createContext()

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  useEffect(() => {
    if (!user) return

    const newSocket = io("http://localhost:3000", {
      transports: ["websocket"]
    })

    newSocket.on("connect", () => {
      newSocket.emit("user_online", user.id)
    })

    newSocket.on("user_status", ({ userId, is_online }) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev)
        if (is_online) updated.add(userId)
        else updated.delete(userId)
        return updated
      })
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [user])

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)