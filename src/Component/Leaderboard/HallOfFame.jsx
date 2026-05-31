import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Authentication/Authentication"
import UserAvatar from "../Common/UserAvatar"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import "./Leaderboard.css"

const CATEGORY_LABELS = {
  top_seller:   "🏪 Top Seller",
  most_viewed:  "👁️ Most Viewed",
  most_liked:   "❤️ Most Liked",
  rising_star:  "⭐ Rising Star",
  most_active:  "🔥 Most Active",
  fan_favorite: "👑 Fan Favorite",
}

const RANK_EMOJI = { 1: "🥇", 2: "🥈", 3: "🥉" }

export default function HallOfFame() {
  const navigate = useNavigate()
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_URL}/leaderboard/hall-of-fame`)
        setPeriods(res.data.periods)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const formatDate = (d) => new Date(d).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric"
  })

  return (
    <div className="leaderboardPage">

      {/* ── Header ── */}
      <div className="leaderboardHeader">
        <button className="backBtn" onClick={() => navigate("/leaderboard")}>
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <EmojiEventsIcon sx={{ fontSize: 24, color: "#f5a623" }} />
          <h2>Hall of Fame</h2>
        </div>
      </div>

      {loading && (
        <p style={{ textAlign: "center", padding: "2rem", color: "var(--accent)" }}>
          Loading...
        </p>
      )}

      {!loading && periods.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <EmojiEventsIcon sx={{ fontSize: 48, color: "var(--border)" }} />
          <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>
            No completed periods yet. Check back after the first leaderboard closes.
          </p>
        </div>
      )}

      {/* ── Period by period ── */}
      {periods.map((period, i) => (
        <div key={i} className="hofPeriod">
          <div className="hofPeriodHeader">
            <EmojiEventsIcon sx={{ fontSize: 18, color: "#f5a623" }} />
            <h3>
              {formatDate(period.start_date)} — {formatDate(period.end_date)}
            </h3>
          </div>

          {/* ── group winners by category ── */}
          {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
            const winners = period.winners.filter(w => w.category === cat)
            if (winners.length === 0) return null
            return (
              <div key={cat} className="hofCategory">
                <p className="hofCategoryLabel">{label}</p>
                {winners.map((w) => (
                  <div
                    key={w.user_id}
                    className="hofEntry"
                    onClick={() => navigate(`/profile/${w.username}`)}
                  >
                    <span style={{ fontSize: 20 }}>{RANK_EMOJI[w.rank]}</span>
                    <UserAvatar avatar_url={w.avatar_url} size={36} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                        {w.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)" }}>
                        @{w.username} · {w.score?.toLocaleString()} pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}