import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Authentication/Authentication"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import "./Auth.css"

export default function ForgotPassword() {
  const navigate = useNavigate()

  // ── three steps: email → code → new password ──────────────────────
  const [step,     setStep]     = useState(1)
  const [email,    setEmail]    = useState("")
  const [code,     setCode]     = useState("")
  const [password, setPassword] = useState("")
  const [confirm,  setConfirm]  = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [success,  setSuccess]  = useState("")

  // ── step 1: send code ─────────────────────────────────────────────
  const handleSendCode = async (e) => {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email })
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send code")
    } finally {
      setLoading(false)
    }
  }

  // ── step 2: verify code ───────────────────────────────────────────
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      await axios.post(`${API_URL}/auth/verify-reset-code`, { email, code })
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.error || "Invalid code")
    } finally {
      setLoading(false)
    }
  }

  // ── step 3: reset password ────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords do not match"); return }
    if (password.length < 6)  { setError("Password must be at least 6 characters"); return }
    setLoading(true); setError("")
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        email, code, newPassword: password
      })
      setSuccess("Password reset successfully!")
      setTimeout(() => navigate("/usersignIn"), 2000)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => step === 1 ? navigate("/usersignIn") : setStep(step - 1)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", display: "flex" }}
            >
              <ArrowBackIcon sx={{ fontSize: 22 }} />
            </button>
            <h1 style={{ fontSize: "1.3rem" }}>
              {step === 1 ? "Forgot Password" : step === 2 ? "Enter Code" : "New Password"}
            </h1>
          </div>

          {/* ── step indicator ── */}
          <div style={{ display: "flex", gap: 6, marginTop: "0.8rem" }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 4,
                background: s <= step ? "var(--accent)" : "var(--border)",
                transition: "background 0.3s"
              }} />
            ))}
          </div>
        </div>

        <div className="auth-body">

          {/* ── Step 1: Enter email ── */}
          {step === 1 && (
            <form onSubmit={handleSendCode}>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: "1rem" }}>
                Enter your Unizik email and we'll send you a reset code.
              </p>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Fn.surname@stu.unizik.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p style={{ color: "#e53935", fontSize: 13 }}>{error}</p>}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>
          )}

          {/* ── Step 2: Enter code ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode}>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: "1rem" }}>
                Enter the 6-digit code sent to <strong>{email}</strong>
              </p>
              <div className="field">
                <label>Reset Code</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  style={{ letterSpacing: 8, fontSize: "1.2rem", textAlign: "center" }}
                  required
                />
              </div>
              {error && <p style={{ color: "#e53935", fontSize: 13 }}>{error}</p>}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify Code"}
              </button>
              {/* ── resend option ── */}
              <p style={{ textAlign: "center", marginTop: "0.8rem", fontSize: 13, color: "var(--text-secondary)" }}>
                Didn't get it?{" "}
                <span
                  onClick={() => handleSendCode({ preventDefault: () => {} })}
                  style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}
                >
                  Resend code
                </span>
              </p>
            </form>
          )}

          {/* ── Step 3: New password ── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: "1rem" }}>
                Choose a strong new password.
              </p>
              <div className="field">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  style={{
                    borderColor: confirm.length > 0
                      ? password === confirm ? "#17bf63" : "#e53935"
                      : undefined
                  }}
                />
                {confirm.length > 0 && (
                  <p style={{
                    fontSize: 11, margin: "3px 0 0",
                    color: password === confirm ? "#17bf63" : "#e53935"
                  }}>
                    {password === confirm ? "✓ Passwords match" : "✕ Passwords do not match"}
                  </p>
                )}
              </div>
              {error   && <p style={{ color: "#e53935", fontSize: 13 }}>{error}</p>}
              {success && <p style={{ color: "#17bf63", fontSize: 13, fontWeight: 600 }}>{success}</p>}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}