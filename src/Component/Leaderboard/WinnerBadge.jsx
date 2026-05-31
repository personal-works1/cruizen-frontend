const BADGE_LABELS = {
  top_seller:   { label: "Top Seller",   emoji: "🏆" },
  most_viewed:  { label: "Most Viewed",  emoji: "👁️" },
  most_liked:   { label: "Most Liked",   emoji: "❤️" },
  rising_star:  { label: "Rising Star",  emoji: "⭐" },
  most_active:  { label: "Most Active",  emoji: "⚡" },
  fan_favorite: { label: "Fan Favorite", emoji: "🌟" },
}

const RANK_MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" }

export default function WinnerBadge({ badges = [], size = "small" }) {
  if (!badges || badges.length === 0) return null

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
      {badges.map((badge, i) => {
        const info = BADGE_LABELS[badge.category]
        if (!info) return null
        return (
          <span
            key={i}
            title={`${RANK_MEDAL[badge.rank]} ${info.label}`}
            style={{
              fontSize: size === "small" ? "10px" : "12px",
              background: "var(--accent-light)",
              color: "var(--accent)",
              borderRadius: "20px",
              padding: size === "small" ? "2px 6px" : "3px 10px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              border: "1px solid var(--accent-mid)",
            }}
          >
            {RANK_MEDAL[badge.rank]} {info.emoji} {size !== "small" && info.label}
          </span>
        )
      })}
    </div>
  )
}