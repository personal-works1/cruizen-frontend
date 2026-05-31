import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../Context/AuthContext'
import { useTheme } from '../Context/ThemeContext'
import { API_URL } from '../Authentication/Authentication'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import './Profile'

export default function Settings() {
  const { token, user, login, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const authHeader = { Authorization: `Bearer ${token}` }

  // Account form
  const [accountForm, setAccountForm] = useState({
    name:     user?.name     || '',
    email:    user?.email    || '',
    phone:    user?.phone    || '',
    dob:      user?.dob      || '',
    location: user?.location || '',
    website:  user?.website  || '',
    bio:      user?.bio      || '',
  })
  const [accountSaving,  setAccountSaving]  = useState(false)
  const [accountSuccess, setAccountSuccess] = useState(false)
  const [accountError,   setAccountError]   = useState('')

  // Password form
  const [passForm, setPassForm] = useState({
    current_password:  '',
    new_password:      '',
    confirm_password:  '',
  })
  const [passSaving,  setPassSaving]  = useState(false)
  const [passSuccess, setPassSuccess] = useState(false)
  const [passError,   setPassError]   = useState('')

  const handleAccountChange = (e) =>
    setAccountForm({ ...accountForm, [e.target.name]: e.target.value })

  const handlePassChange = (e) =>
    setPassForm({ ...passForm, [e.target.name]: e.target.value })

  const handleAccountSave = async () => {
    setAccountSaving(true); setAccountError(''); setAccountSuccess(false)
    try {
      const res = await axios.put(`${API_URL}/profile/update/me`, accountForm, {
        headers: authHeader
      })
      login(token, { ...user, ...res.data.user })
      setAccountSuccess(true)
      setTimeout(() => setAccountSuccess(false), 3000)
    } catch (err) {
      setAccountError(err.response?.data?.error || 'Failed to save')
    } finally {
      setAccountSaving(false)
    }
  }

  const handlePasswordSave = async () => {
    if (passForm.new_password !== passForm.confirm_password) {
      setPassError('Passwords do not match'); return
    }
    if (passForm.new_password.length < 6) {
      setPassError('Password must be at least 6 characters'); return
    }
    setPassSaving(true); setPassError(''); setPassSuccess(false)
    try {
      await axios.put(`${API_URL}/auth/change-password`, {
        current_password: passForm.current_password,
        new_password:     passForm.new_password,
      }, { headers: authHeader })
      setPassSuccess(true)
      setPassForm({ current_password: '', new_password: '', confirm_password: '' })
      setTimeout(() => setPassSuccess(false), 3000)
    } catch (err) {
      setPassError(err.response?.data?.error || 'Failed to change password')
    } finally {
      setPassSaving(false)
    }
  }

// wherever your logout button lives, replace the direct logout() call with this:
const handleLogout = async () => {
  const refreshToken = localStorage.getItem("refreshToken")
  
  // tell backend to wipe the refresh token from DB so it can't be reused
  await axios.post(`${API_URL}/auth/logout`, { refreshToken }).catch(() => {})
  
  // then clear frontend state
  logout()
  navigate("/usersignIn")
}

  return (
    <div className="settingsPage">

      {/* Header */}
      <div className="settingsHeader">
        <button className="settingsBackBtn" onClick={() => navigate(-1)}>
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </button>
        <h2>Settings</h2>
      </div>

      {/* Account */}
      <div className="settingsSection">
        <div className="settingsSectionHeader">
          <PersonOutlinedIcon sx={{ fontSize: 20, color: '#61027b' }} />
          <h3>Account Information</h3>
        </div>
        <div className="settingsGrid">
          <div className="settingsField">
            <label>Full Name</label>
            <input name="name" value={accountForm.name}
              onChange={handleAccountChange} placeholder="Your name" />
          </div>
          <div className="settingsField">
            <label>Email</label>
            <input name="email" type="email" value={accountForm.email}
              onChange={handleAccountChange} placeholder="email@example.com" />
          </div>
          <div className="settingsField">
            <label>Phone</label>
            <input name="phone" value={accountForm.phone}
              onChange={handleAccountChange} placeholder="08012345678" />
          </div>
          <div className="settingsField">
            <label>Date of Birth</label>
            <input name="dob" type="date"
              value={accountForm.dob?.slice(0, 10) || ''}
              onChange={handleAccountChange} />
          </div>
          <div className="settingsField">
            <label>Location</label>
            <input name="location" value={accountForm.location}
              onChange={handleAccountChange} placeholder="Lagos, Nigeria" />
          </div>
          <div className="settingsField">
            <label>Website</label>
            <input name="website" value={accountForm.website}
              onChange={handleAccountChange} placeholder="https://yoursite.com" />
          </div>
        </div>
        <div className="settingsField">
          <label>Bio</label>
          <textarea name="bio" value={accountForm.bio}
            onChange={handleAccountChange}
            placeholder="Tell people about yourself..."
            rows={3} className="settingsTextarea" />
        </div>
        {accountError && <p className="settingsError">{accountError}</p>}
        {accountSuccess && (
          <div className="settingsSuccess">
            <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
            Profile updated successfully!
          </div>
        )}
        <button className="settingsSaveBtn" onClick={handleAccountSave}
          disabled={accountSaving}>
          {accountSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Password */}
      <div className="settingsSection">
        <div className="settingsSectionHeader">
          <LockOutlinedIcon sx={{ fontSize: 20, color: '#61027b' }} />
          <h3>Change Password</h3>
        </div>
        <div className="settingsField">
          <label>Current Password</label>
          <input name="current_password" type="password"
            value={passForm.current_password} onChange={handlePassChange}
            placeholder="Enter current password" />
        </div>
        <div className="settingsField">
          <label>New Password</label>
          <input name="new_password" type="password"
            value={passForm.new_password} onChange={handlePassChange}
            placeholder="Enter new password" />
        </div>
        <div className="settingsField">
          <label>Confirm New Password</label>
          <input name="confirm_password" type="password"
            value={passForm.confirm_password} onChange={handlePassChange}
            placeholder="Confirm new password" />
        </div>
        {passError && <p className="settingsError">{passError}</p>}
        {passSuccess && (
          <div className="settingsSuccess">
            <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
            Password changed successfully!
          </div>
        )}
        <button className="settingsSaveBtn" onClick={handlePasswordSave}
          disabled={passSaving}>
          {passSaving ? 'Saving...' : 'Update Password'}
        </button>
      </div>

      {/* Theme */}
      <div className="settingsSection">
        <div className="settingsSectionHeader">
          {theme === 'dark'
            ? <DarkModeOutlinedIcon sx={{ fontSize: 20, color: '#61027b' }} />
            : <LightModeOutlinedIcon sx={{ fontSize: 20, color: '#61027b' }} />
          }
          <h3>Appearance</h3>
        </div>
        <div className="themeToggleRow">
          <div className="themeInfo">
            <p className="themeLabel">
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </p>
            <p className="themeSubLabel">
              {theme === 'dark'
                ? 'Easy on the eyes at night'
                : 'Clean and bright interface'
              }
            </p>
          </div>
          <button
            className={`themeToggleBtn ${theme === 'dark' ? 'dark' : ''}`}
            onClick={toggleTheme}
          >
            <span className="themeToggleKnob" />
          </button>
        </div>
      </div>

      {/* Logout */}
      <button className="settingsLogoutBtn" onClick={handleLogout}>
        <LogoutIcon sx={{ fontSize: 18 }} />
        Log Out
      </button>

    </div>
  )
}