import { Navigate } from "react-router-dom"
// import { useAuth } from "../Context/AuthContext"
import { useAuth } from "./Context/AuthContext"

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()

  // wait for localStorage to load before deciding
  if (loading) return <div>Loading...</div>

  // no token → redirect to auth
  if (!token) return <Navigate to="/usersignIn" />

  // token exists → render the page
  return children
}

export default ProtectedRoute