import { createContext, useContext, useState, useEffect, useMemo } from "react"
import axios from "axios"
import { useAuth } from "./AuthContext"
import { API_URL } from "../Authentication/Authentication"

const ModeContext = createContext()

export function ModeProvider({ children }) {
  const { user, loading } = useAuth()
  const [mode, setMode]           = useState("personal")
  const [vendorProfile, setVendorProfile] = useState(null) // ← business identity lives here

  // ── fetch vendor profile whenever user logs in ───────────────────────
  // this gives us shop name, logo etc for the business identity
useEffect(() => {
    if (loading) return

    if (!user) {
      setMode("personal")
      setVendorProfile(null)
      localStorage.removeItem("mode")
      return
    }

    // console.log("USER ROLE:", user.role) // ← is it actually "both"?

    if (user.role === "both") {
      
      axios.get(`${API_URL}/vendors/mine`)
      .then(res => {
        //console.log("VENDOR FETCHED:", res.data.vendor) // ← is vendor coming back?
        setVendorProfile(res.data.vendor)
      })
      .catch(err => console.error("Failed to load vendor profile", err))

      const savedMode = localStorage.getItem("mode")
      // console.log("SAVED MODE:", savedMode) // ← what's in localStorage?
      if (savedMode === "business") setMode("business")
    } else {
      setMode("personal")
    }
  }, [user, loading])

  
  const switchMode = () => {
    const newMode = mode === "personal" ? "business" : "personal"
    setMode(newMode)
    localStorage.setItem("mode", newMode)
  }

  // ── what the current active identity looks like ──────────────────────
  // any component can read this instead of figuring it out themselves
 const activeIdentity = useMemo(() => 
  mode === "business" && vendorProfile
    ? {
        id:         vendorProfile.id,
        name:       vendorProfile.business_name,
        username:   vendorProfile.business_name,
        avatar_url: vendorProfile.avatar_url,
        type:       "business",
        vendor_id:  vendorProfile.id,
      }
    : {
        id:         user?.id,
        name:       user?.name,
        username:   user?.username,
        avatar_url: user?.avatar_url,  // ← will now always reflect latest user
        type:       "personal",
        vendor_id:  null,
      }
, [mode, vendorProfile, user])

  return (
    <ModeContext.Provider value={{ mode, switchMode, vendorProfile, setVendorProfile, activeIdentity }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  return useContext(ModeContext)
}