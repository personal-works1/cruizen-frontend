import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from '../Authentication/Authentication'
import UserAvatar from '../Common/UserAvatar'
import VerifiedIcon from '@mui/icons-material/Verified'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import ReplayIcon from '@mui/icons-material/Replay'
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'

const BADGE_CONFIG = {
  'Top Seller': { color: '#f5a623', bg: '#fff8ed' },
  'Trusted':    { color: '#17bf63', bg: '#edfff4' },
  'Growing':    { color: '#61027b', bg: '#f5e6ff' },
  'New':        { color: '#888',    bg: '#f5f5f5' },
}

function StarRating({ rating }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        s <= Math.round(rating)
          ? <StarIcon key={s} sx={{ fontSize: 16, color: '#f5a623' }} />
          : <StarBorderIcon key={s} sx={{ fontSize: 16, color: '#f5a623' }} />
      ))}
    </div>
  )
}

function StatRow({ icon, label, value, color }) {
  return (
    <div className="trustStatRow">
      <div className="trustStatLeft">
        <span style={{ color: color || '#61027b' }}>{icon}</span>
        <span className="trustStatLabel">{label}</span>
      </div>
      <span className="trustStatValue">{value}</span>
    </div>
  )
}

function ReviewCard({ review }) {
  return (
    <div className="trustReviewCard">
      <div className="trustReviewHeader">
        <UserAvatar avatar_url={review.reviewer_avatar} size={32} />
        <div>
          <p className="trustReviewerName">
            {review.reviewer_name}
            {review.reviewer_verified && (
              <VerifiedIcon sx={{ fontSize: 14, color: '#61027b', ml: 0.5 }} />
            )}
          </p>
          <p className="trustReviewerUsername">@{review.reviewer_username}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StarRating rating={review.rating} />
        </div>
      </div>
      <p className="trustReviewText">{review.review_text}</p>
      <p className="trustReviewDate">
        {new Date(review.created_at).toLocaleDateString('en-NG', {
          day: 'numeric', month: 'short', year: 'numeric'
        })}
      </p>
    </div>
  )
}

export default function TrustCard({ username }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_URL}/vendors/${username}/trust`)
        setData(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [username])

  if (loading) return (
    <div className="trustCard">
      <p style={{ textAlign: 'center', color: '#888', padding: '1rem' }}>
        Loading trust info...
      </p>
    </div>
  )

  if (!data?.stats) return null

  const { stats, reviews } = data
  const badge = BADGE_CONFIG[stats.badge] || BADGE_CONFIG['New']

  // account age
  const memberSince = new Date(stats.member_since)
  const months = Math.floor(
    (new Date() - memberSince) / (1000 * 60 * 60 * 24 * 30)
  )
  const accountAge = months < 1 ? 'New account'
    : months < 12 ? `${months} month${months > 1 ? 's' : ''}`
    : `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''}`

  // last active
  const lastActive = stats.last_active
    ? new Date(stats.last_active).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    : 'Unknown'

  // delivery speed
  const deliverySpeed = stats.avg_delivery_hours > 0
    ? stats.avg_delivery_hours < 24
      ? `${stats.avg_delivery_hours}hrs avg`
      : `${Math.round(stats.avg_delivery_hours / 24)} days avg`
    : 'No data'

  return (
    <div className="trustCard">

      {/* ── Header ── */}
      <div className="trustCardHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 className="trustCardTitle">Trust & Reputation</h3>
          {stats.is_verified && (
            <VerifiedIcon sx={{ fontSize: 20, color: '#61027b' }} />
          )}
        </div>
        <span className="trustBadge" style={{
          background: badge.bg, color: badge.color
        }}>
          {stats.badge}
        </span>
      </div>

      {/* ── Rating ── */}
      <div className="trustRatingRow">
        <StarRating rating={stats.avg_rating} />
        <span className="trustRatingNum">
          {stats.avg_rating > 0 ? Number(stats.avg_rating).toFixed(1) : 'No ratings'}
        </span>
        <span className="trustRatingCount">
          ({stats.review_count} review{stats.review_count !== 1 ? 's' : ''})
        </span>
      </div>

      {/* ── Stats ── */}
      <div className="trustStats">
        <StatRow
          icon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
          label="Completed Orders"
          value={`${stats.completed_orders} orders`}
        />
        <StatRow
          icon={<CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />}
          label="Account Age"
          value={accountAge}
        />
        <StatRow
          icon={<LocalShippingOutlinedIcon sx={{ fontSize: 16 }} />}
          label="Delivery Speed"
          value={deliverySpeed}
        />
        <StatRow
          icon={<ReplayIcon sx={{ fontSize: 16 }} />}
          label="Repeat Customers"
          value={`${stats.repeat_customer_pct}%`}
        />
        <StatRow
          icon={<GppBadOutlinedIcon sx={{ fontSize: 16 }} />}
          label="Dispute Rate"
          value={`${stats.dispute_rate}%`}
          color={stats.dispute_rate > 10 ? '#e0245e' : '#17bf63'}
        />
        <StatRow
          icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
          label="Last Active"
          value={lastActive}
        />
        <StatRow
          icon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
          label="Completion Rate"
          value={`${stats.completion_rate}%`}
        />
      </div>

      {/* ── Verified Badge ── */}
      {stats.is_verified && (
        <div className="trustVerifiedBanner">
          <VerifiedIcon sx={{ fontSize: 16, color: '#61027b' }} />
          <span>
            Identity verified
            {stats.verified_type === 'purchased' ? ' · Blue Tick' : ' · Earned'}
          </span>
        </div>
      )}

      {/* ── Reviews ── */}
      {reviews.length > 0 && (
        <div className="trustReviews">
          <h4 className="trustReviewsTitle">
            Buyer Reviews
          </h4>
          {reviews.map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
        </div>
      )}

      {reviews.length === 0 && (
        <p className="trustNoReviews">No reviews yet.</p>
      )}
    </div>
  )
}