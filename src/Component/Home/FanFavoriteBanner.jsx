import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "../Context/AuthContext"
import { API_URL } from "../Authentication/Authentication"
import UserAvatar from "../Common/UserAvatar"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import CloseIcon from "@mui/icons-material/Close"

export default function FanFavoriteBanner() {

  const [nominees,  setNominees]  = useState([])
  const [period,    setPeriod]    = useState(null)
  const [hasVoted,  setHasVoted]  = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [voting,    setVoting]    = useState(null) // id of nominee being voted for
  const [visible,   setVisible]   = useState(false)

  useEffect(() => {
    const fetchNominees = async () => {
      try {
        const res = await axios.get(`${API_URL}/leaderboard/nominees`)

        const { nominees, period, hasVoted } = res.data

        if (!period) return
        if (hasVoted) return // ← already voted, don't show

        // ── check if dismissed this period ────────────────────────────
        const dismissedPeriod = localStorage.getItem("fan_vote_dismissed")
        if (dismissedPeriod === period.id) return // ← dismissed, don't show

        setNominees(nominees)
        setPeriod(period)
        setHasVoted(hasVoted)
        setVisible(true)
      } catch (err) { console.error(err) }
    }
    fetchNominees()
  }, [])

  // ── dismiss banner — stores period id so it doesn't show again ───────
  const handleDismiss = () => {
    if (period) localStorage.setItem("fan_vote_dismissed", period.id)
    setVisible(false)
  }

  // ── cast vote ─────────────────────────────────────────────────────────
  const handleVote = async (nomineeId) => {
    setVoting(nomineeId)
    try {
      await axios.post(
        `${API_URL}/leaderboard/vote`,
        { nominee_id: nomineeId },
      )
      // ── voted successfully → hide banner ─────────────────────────────
      setVisible(false)
      setHasVoted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setVoting(null)
    }
  }

  // ── don't render if not visible ───────────────────────────────────────
  if (!visible || nominees.length === 0) return null

  return (
    <div style={{
      background: "linear-gradient(135deg, #61027b, #9c01c6)",
      borderRadius: "16px",
      padding: "1rem",
      marginBottom: "0.8em",
      position: "relative",
      overflow: "hidden"
    }}>

      {/* ── close button ── */}
      <button
        onClick={handleDismiss}
        style={{
          position: "absolute", top: 10, right: 10,
          background: "rgba(255,255,255,0.2)",
          border: "none", borderRadius: "50%",
          width: 28, height: 28,
          cursor: "pointer", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}
      >
        <CloseIcon sx={{ fontSize: 16 }} />
      </button>

      {/* ── header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.8rem" }}>
        <EmojiEventsIcon sx={{ fontSize: 22, color: "#f5a623" }} />
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: 0 }}>
          Fan Favorite — Vote Now!
        </p>
        <span style={{
          fontSize: 11, color: "rgba(255,255,255,0.7)",
          marginLeft: "auto", marginRight: "2rem"
        }}>
          1 vote per period
        </span>
      </div>

      {/* ── nominees — scrolls horizontally like marquee ── */}
      <div style={{
        display: "flex",
        gap: "0.8rem",
        overflowX: "auto",
        scrollbarWidth: "none",
        paddingBottom: "4px"
      }}>
        {nominees.map((nominee) => (
          <div
            key={nominee.id}
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "12px",
              padding: "0.6rem 0.8rem",
              minWidth: "100px"
            }}
          >
            <UserAvatar avatar_url={nominee.avatar_url} size={44} />
            <p style={{
              color: "#fff", fontSize: 12, fontWeight: 600,
              margin: 0, textAlign: "center",
              maxWidth: 90, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              @{nominee.username}
            </p>
            {/* ── vote button ── */}
            <button
              onClick={() => handleVote(nominee.id)}
              disabled={voting !== null}
              style={{
                background: voting === nominee.id ? "#f5a623" : "#fff",
                color: "#61027b",
                border: "none",
                borderRadius: "20px",
                padding: "4px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                opacity: voting && voting !== nominee.id ? 0.5 : 1
              }}
            >
              {voting === nominee.id ? "Voting..." : "Vote"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}