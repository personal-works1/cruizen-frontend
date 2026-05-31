import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../Context/AuthContext"
import { API_URL } from "../Authentication/Authentication"
import UserAvatar from "../Common/UserAvatar"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import "./Leaderboard.css"

// ── category display names ────────────────────────────────────────────────────
const CATEGORY_LABELS = {
  top_seller:    "🏪 Top Seller",
  most_viewed:   "👁️ Most Viewed",
  most_liked:    "❤️ Most Liked",
  rising_star:   "⭐ Rising Star",
  most_active:   "🔥 Most Active",
  fan_favorite:  "👑 Fan Favorite",
}

// ── rank badge ────────────────────────────────────────────────────────────────
function RankBadge({ rank }) {
  const colors = {
    1: { bg: "#FFD700", color: "#7a5c00", label: "🥇" },
    2: { bg: "#C0C0C0", color: "#4a4a4a", label: "🥈" },
    3: { bg: "#CD7F32", color: "#5c3300", label: "🥉" },
  }
  const style = colors[rank] || { bg: "#f5e6ff", color: "#61027b", label: `#${rank}` }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      background: style.bg, color: style.color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: rank <= 3 ? 18 : 13,
      flexShrink: 0
    }}>
      {style.label}
    </div>
  )
}

export default function Leaderboard() {
  const { getValidToken }   = useAuth()
  const navigate            = useNavigate()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("top_seller")

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getValidToken()
        const res = await axios.get(`${API_URL}/leaderboard/current`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setData(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "var(--accent)" }}>
      Loading leaderboard...
    </div>
  )

  if (!data) return (
    <div style={{ textAlign: "center", padding: "3rem" }}>
      No active leaderboard period.
    </div>
  )

  const { period, rankings } = data
  const currentRankings = rankings[activeTab] || []

  // ── format date ───────────────────────────────────────────────────────
  const formatDate = (d) => new Date(d).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric"
  })

  // ── days remaining ────────────────────────────────────────────────────
  const daysLeft = Math.ceil(
    (new Date(period.end_date) - new Date()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="leaderboardPage">

      {/* ── Header ── */}
      <div className="leaderboardHeader">
        <button className="backBtn" onClick={() => navigate(-1)}>
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </button>
        <div>
          <h2>Leaderboard</h2>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
            {formatDate(period.start_date)} — {formatDate(period.end_date)}
            {" · "}
            <span style={{ color: daysLeft <= 3 ? "#e53935" : "var(--accent)", fontWeight: 600 }}>
              {daysLeft} days left
            </span>
          </p>
        </div>
        {/* ── hall of fame link ── */}
        <button
          onClick={() => navigate("/leaderboard/hall-of-fame")}
          style={{
            marginLeft: "auto",
            background: "var(--accent-light)",
            border: "1.5px solid var(--border)",
            borderRadius: "8px",
            padding: "6px 12px",
            color: "var(--accent)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4
          }}
        >
          <EmojiEventsIcon sx={{ fontSize: 16 }} /> Hall of Fame
        </button>
      </div>

      {/* ── Category Tabs ── */}
      <div className="leaderboardTabs">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`leaderboardTab ${activeTab === key ? "active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Top 3 Podium ── */}
      {currentRankings.length > 0 && (
        <div className="leaderboardPodium">
          {currentRankings.slice(0, 3).map((entry) => (
            <div
              key={entry.id}
              className={`podiumCard rank${entry.rank}`}
              onClick={() => navigate(`/profile/${entry.username}`)}
            >
              <RankBadge rank={entry.rank} />
              <UserAvatar avatar_url={entry.avatar_url} size={entry.rank === 1 ? 64 : 52} />
              <p className="podiumName">@{entry.username}</p>
              <p className="podiumScore">
                {entry.score?.toLocaleString()}
                <span style={{ fontSize: 10, marginLeft: 3 }}>pts</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Ranked List 4-10 ── */}
      <div className="leaderboardList">
        {currentRankings.slice(3).map((entry) => (
          <div
            key={entry.id}
            className="leaderboardItem"
            onClick={() => navigate(`/profile/${entry.username}`)}
          >
            <RankBadge rank={entry.rank} />
            <UserAvatar avatar_url={entry.avatar_url} size={40} />
            <div className="leaderboardItemInfo">
              <p className="leaderboardItemName">{entry.name}</p>
              <p className="leaderboardItemUsername">@{entry.username}</p>
            </div>
            <p className="leaderboardItemScore">
              {entry.score?.toLocaleString()} pts
            </p>
          </div>
        ))}

        {currentRankings.length === 0 && (
          <p style={{
            textAlign: "center", color: "var(--text-secondary)",
            padding: "2rem", fontSize: 14
          }}>
            No entries yet for this category.
          </p>
        )}
      </div>
    </div>
  )
}