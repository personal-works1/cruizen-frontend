import { Navigate } from "react-router-dom"
import { useAuth } from "./Context/AuthContext"

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>

  if (!user) return <Navigate to="/usersignIn" />

  return children
}

export default ProtectedRoute