import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { useAuth } from "../Context/AuthContext";

// export const API_URL = "http://localhost:3000";
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

function Auth() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [isLogin,             setIsLogin]             = useState(true);
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: "", username: "", email: "", phone: "",
    password: "", confirmPassword: "", level: "", role: "user",
  });

  // ── username availability state ───────────────────────────────────────
  const [usernameStatus,  setUsernameStatus]  = useState(null) // null | 'checking' | 'available' | 'taken'
  const usernameDebounce = useRef(null)

  // ── password match state ──────────────────────────────────────────────
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })

    // ── check username availability as user types ─────────────────────
    if (e.target.name === "username") {
      const val = e.target.value.trim()
      if (!val) { setUsernameStatus(null); return }

      setUsernameStatus("checking")
      clearTimeout(usernameDebounce.current)
      usernameDebounce.current = setTimeout(async () => {
        try {
          const res = await axios.get(`${API_URL}/auth/check-username?username=${val}`)
          setUsernameStatus(res.data.available ? "available" : "taken")
        } catch {
          setUsernameStatus(null)
        }
      }, 500) // ← wait 500ms after user stops typing
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isLogin && form.password !== form.confirmPassword) {
      alert("Passwords do not match"); return
    }

    if (!isLogin && usernameStatus === "taken") {
      alert("Username is already taken"); return
    }

    try {
  if (isLogin) {
    const response = await axios.post(`${API_URL}/auth/login`, {
      Identifier: form.Identifier?.trim(),
      password:   form.password?.trim(),
    })
    login(response.data.token, response.data.refreshToken, response.data.user)
    navigate("/")
  } else {
    const response = await axios.post(`${API_URL}/auth/register`, {
      name:            form.name?.trim(),
      username:        form.username?.trim(),
      email:           form.email?.trim().toLowerCase(),
      phone:           form.phone?.trim(),
      password:        form.password?.trim(),
      confirmPassword: form.confirmPassword?.trim(),
      level:           form.level?.trim(),
      role:            "user",
    })
    // ← redirect to verify page with email
    navigate("/verify-email", { state: { email: response.data.email } })
  }
} catch (error) {
  console.error(error)
  // ← if login fails because email not verified → redirect to verify page
  if (error.response?.status === 403 && error.response?.data?.email) {
    navigate("/verify-email", { state: { email: error.response.data.email } })
    return
  }
  alert(error.response?.data?.error || "Something went wrong")
}
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{isLogin ? "Welcome Back" : "Create Account"}</h1>
          <div className="auth-toggle">
            <button className={isLogin ? "active" : "inactive"} onClick={() => setIsLogin(true)}>
              Login
            </button>
            <button className={!isLogin ? "active" : "inactive"} onClick={() => setIsLogin(false)}>
              Sign Up
            </button>
          </div>
        </div>

        <div className="auth-body">
          <form onSubmit={handleSubmit}>
            {isLogin ? (
              <>
                <div className="field">
                  <label>Email or Username</label>
                  <input type="text" name="Identifier"
                    placeholder="username or email"
                    onChange={handleChange} required />
                </div>
                <div className="field">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password" placeholder="••••••••"
                      onChange={handleChange} required
                    />
                    <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </span>
                  </div>
                </div>

                {/* ── forgot password link ── */}
                <p style={{ textAlign: "right", margin: "-0.5rem 0 0.8rem" }}>
                  <span
                    onClick={() => navigate("/forgot-password")}
                    style={{ fontSize: "0.8rem", color: "var(--accent)", cursor: "pointer", fontWeight: 500 }}
                  >
                    Forgot password?
                  </span>
                </p>
              </>
            ) : (
              <>
                <div className="two-col">
                  <div className="field">
                    <label>Name</label>
                    <input type="text" name="name" placeholder="James"
                      onChange={handleChange} required />
                  </div>

                  {/* ── username field with availability indicator ── */}
                  <div className="field">
                    <label>Username</label>
                    <div className="input-wrapper">
                      <input
                        type="text" name="username" placeholder="@james"
                        onChange={handleChange} required
                        style={{
                          borderColor: usernameStatus === "available" ? "#17bf63"
                            : usernameStatus === "taken" ? "#e53935"
                            : undefined
                        }}
                      />
                      {/* ── status icon ── */}
                      {usernameStatus === "checking" && (
                        <span className="eye-icon" style={{ color: "#888", fontSize: 12 }}>...</span>
                      )}
                      {usernameStatus === "available" && (
                        <span className="eye-icon">
                          <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "#17bf63" }} />
                        </span>
                      )}
                      {usernameStatus === "taken" && (
                        <span className="eye-icon">
                          <CancelOutlinedIcon sx={{ fontSize: 18, color: "#e53935" }} />
                        </span>
                      )}
                    </div>
                    {/* ── status message ── */}
                    {usernameStatus === "available" && (
                      <p style={{ fontSize: "11px", color: "#17bf63", margin: "3px 0 0" }}>
                        ✓ Username available
                      </p>
                    )}
                    {usernameStatus === "taken" && (
                      <p style={{ fontSize: "11px", color: "#e53935", margin: "3px 0 0" }}>
                        ✕ Username already taken
                      </p>
                    )}
                  </div>
                </div>

                <div className="two-col">
                  <div className="field">
                    <label>Phone</label>
                    <input type="tel" name="phone" placeholder="08012345678"
                      onChange={handleChange} required />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input type="email" name="email"
                      placeholder="Fn.surname@stu.unizik.edu.ng"
                      onChange={handleChange} required />
                  </div>
                </div>

                <div className="two-col">
                  <div className="field">
                    <label>Password</label>
                    <div className="input-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password" placeholder="••••••••"
                        onChange={handleChange} required
                      />
                      <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </span>
                    </div>
                  </div>

                  {/* ── confirm password with match indicator ── */}
                  <div className="field">
                    <label>Confirm Password</label>
                    <div className="input-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword" placeholder="••••••••"
                        onChange={handleChange} required
                        style={{
                          borderColor: form.confirmPassword.length > 0
                            ? passwordsMatch ? "#17bf63" : "#e53935"
                            : undefined
                        }}
                      />
                      <span className="eye-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </span>
                    </div>
                    {/* ── match indicator ── */}
                    {form.confirmPassword.length > 0 && (
                      <p style={{
                        fontSize: "11px", margin: "3px 0 0",
                        color: passwordsMatch ? "#17bf63" : "#e53935"
                      }}>
                        {passwordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="field">
                  <label>Level / Status <span className="optional">(optional)</span></label>
                  <select name="level" onChange={handleChange}>
                    <option value="">Select your level</option>
                    <option>100 Level</option>
                    <option>200 Level</option>
                    <option>300 Level</option>
                    <option>400 Level</option>
                    <option>Postgraduate</option>
                    <option>Staff</option>
                    <option>Graduate / Alumni</option>
                    <option>Other</option>
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="submit-btn"
              disabled={!isLogin && usernameStatus === "taken"}>
              {isLogin ? "Login" : "Create Account"}
            </button>
            <p className="auth-footer">
              {isLogin ? "No account?" : "Already have one?"}
              <span onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? " Sign up here" : " Login here"}
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Auth