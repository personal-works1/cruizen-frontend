import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../Context/AuthContext"
import { API_URL } from "../Authentication/Authentication"
import "./Auth.css"

export default function VerifyEmail() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const location     = useLocation()
  const email        = location.state?.email || ""

  const [code,       setCode]       = useState("")
  const [loading,    setLoading]    = useState(false)
  const [resending,  setResending]  = useState(false)
  const [error,      setError]      = useState("")
  const [resendMsg,  setResendMsg]  = useState("")

  const handleVerify = async (e) => {
    e.preventDefault()
    if (code.length !== 6) { setError("Enter the 6-digit code"); return }
    setLoading(true)
    setError("")
    try {
      const res = await axios.post(`${API_URL}/auth/verify-email`, { email, code })
      // ← auto-login and go home
      login( res.data.user)
      navigate("/")
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setResendMsg("")
    setError("")
    try {
      await axios.post(`${API_URL}/auth/resend-verification`, { email })
      setResendMsg("New code sent! Check your email.")
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend code")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Verify Your Email</h1>
        </div>
        <div className="auth-body">
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "1rem" }}>
            We sent a 6-digit code to <strong>{email}</strong>. Enter it below to activate your account.
          </p>
          <form onSubmit={handleVerify}>
            <div className="field">
              <label>Verification Code</label>
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                style={{
                  fontSize: "1.5rem",
                  letterSpacing: "8px",
                  textAlign: "center",
                  fontWeight: 700,
                }}
                autoFocus
              />
            </div>

            {error && (
              <p style={{ color: "#e53935", fontSize: "13px", margin: "-0.5rem 0 0.5rem" }}>
                {error}
              </p>
            )}
            {resendMsg && (
              <p style={{ color: "#17bf63", fontSize: "13px", margin: "-0.5rem 0 0.5rem" }}>
                {resendMsg}
              </p>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "13px", color: "var(--text-secondary)" }}>
            Didn't receive it?{" "}
            <span
              onClick={handleResend}
              style={{
                color: "var(--accent)",
                cursor: resending ? "not-allowed" : "pointer",
                fontWeight: 600
              }}
            >
              {resending ? "Sending..." : "Resend code"}
            </span>
          </p>

          <p style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "13px" }}>
            <span
              onClick={() => navigate("/usersignIn")}
              style={{ color: "var(--accent)", cursor: "pointer" }}
            >
              ← Back to login
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}