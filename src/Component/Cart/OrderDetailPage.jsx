import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../Context/AuthContext'
import { API_URL } from '../Authentication/Authentication'
import UserAvatar from '../Common/UserAvatar'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'

const STATUS_STEPS = ['paid', 'delivered', 'completed']

const STATUS_CONFIG = {
  paid:      { label: 'Order Placed',  icon: <AccessTimeIcon />,           color: '#f5a623' },
  delivered: { label: 'Delivered',     icon: <LocalShippingOutlinedIcon />, color: '#17bf63' },
  completed: { label: 'Completed',     icon: <CheckCircleOutlineIcon />,    color: '#61027b' },
}

// ── Star Picker ───────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
        >
          {s <= (hovered || value)
            ? <StarIcon sx={{ fontSize: 32, color: '#f5a623' }} />
            : <StarBorderIcon sx={{ fontSize: 32, color: '#f5a623' }} />
          }
        </button>
      ))}
    </div>
  )
}

// ── Review Section ────────────────────────────────────────────────────────────
function ReviewSection({ order, user, onReviewed }) {
  const [canReview,      setCanReview]      = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [reviewStatus,   setReviewStatus]   = useState(null)
  const [rating,         setRating]         = useState(0)
  const [reviewText,     setReviewText]     = useState('')
  const [submitting,     setSubmitting]     = useState(false)
  const [success,        setSuccess]        = useState(false)
  const [error,          setError]          = useState('')
  const [checkLoading,   setCheckLoading]   = useState(true)

  const isBuyer  = user?.id === order.buyer_id
  const isSeller = user?.id === order.seller_id

  useEffect(() => {
    const checkReview = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/reviews/can-review/${order.id}`,
        )
        setCanReview(res.data.can_review)
        setAlreadyReviewed(res.data.already_reviewed)
        setReviewStatus(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setCheckLoading(false)
      }
    }
    if (order.status === 'delivered' || order.status === 'completed') {
      checkReview()
    } else {
      setCheckLoading(false)
    }
  }, [order.id, order.status])

  const handleSubmit = async () => {
    if (!rating) { setError('Please select a rating'); return }
    setSubmitting(true); setError('')
    try {
      await axios.post(`${API_URL}/reviews/create`, {
        order_id: order.id,
        rating,
        review_text: reviewText || null
      })
      setSuccess(true)
      onReviewed()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  if (checkLoading) return null

  // order not delivered yet
  if (order.status === 'paid') return null

  // already reviewed
  if (alreadyReviewed) return (
    <div className="reviewSection">
      <div className="reviewDone">
        <CheckCircleOutlineIcon sx={{ fontSize: 20, color: '#17bf63' }} />
        <p>You have already reviewed this order.</p>
      </div>
    </div>
  )

  // review submitted just now
  if (success) return (
    <div className="reviewSection">
      <div className="reviewDone">
        <CheckCircleOutlineIcon sx={{ fontSize: 20, color: '#17bf63' }} />
        <p>Review submitted! Thank you.</p>
      </div>
    </div>
  )

  // window not open yet
  if (reviewStatus && !canReview && !alreadyReviewed && reviewStatus.review_eligible_at) {
    const eligibleAt = new Date(reviewStatus.review_eligible_at)
    const now = new Date()
    if (eligibleAt > now) return (
      <div className="reviewSection">
        <div className="reviewNotice">
          <AccessTimeIcon sx={{ fontSize: 16, color: '#f5a623' }} />
          <div>
            <p style={{ fontWeight: 600, color: '#2d002d', fontSize: '13px' }}>
              Review unlocks in {Math.ceil((eligibleAt - now) / (1000 * 60 * 60))} hours
            </p>
            <p style={{ fontSize: '11px', color: '#aaa' }}>
              Expires {new Date(reviewStatus.review_deadline_at).toLocaleDateString('en-NG', {
                day: 'numeric', month: 'short'
              })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // window expired
  if (reviewStatus && !canReview && !alreadyReviewed) return (
    <div className="reviewSection">
      <div className="reviewNotice" style={{ borderColor: '#e0245e' }}>
        <p style={{ color: '#e0245e', fontSize: '13px', fontWeight: 600 }}>
          Review window has expired.
        </p>
      </div>
    </div>
  )

  // can review
  if (!canReview) return null

  const reviewTarget = isBuyer
    ? `@${order.seller_username}`
    : `@${order.buyer_username}`

  return (
    <div className="reviewSection">
      <h4 className="reviewSectionTitle">
        Leave a Review for {reviewTarget}
      </h4>

      {/* Star Rating */}
      <div className="reviewStarRow">
        <StarPicker value={rating} onChange={setRating} />
        {rating > 0 && (
          <span style={{ fontSize: '13px', color: '#888', marginLeft: '8px' }}>
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
          </span>
        )}
      </div>

      {/* Review Text */}
      <textarea
        className="reviewTextarea"
        placeholder={`Share your experience with ${reviewTarget}... (optional)`}
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        rows={3}
        maxLength={500}
      />
      <p style={{ fontSize: '11px', color: '#aaa', textAlign: 'right' }}>
        {reviewText.length}/500
      </p>

      {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}

      <button
        className="submitReviewBtn"
        onClick={handleSubmit}
        disabled={submitting || !rating}
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { id }          = useParams()
  const navigate        = useNavigate()
  const { user } = useAuth()

  const [order,   setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${API_URL}/orders/${id}`)
        setOrder(res.data)
      } catch (err) {
        setError('Order not found.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  const handleMarkDelivered = async () => {
    setMarking(true)
    try {
      const res = await axios.put(`${API_URL}/orders/${id}/deliver`)
      setOrder(res.data.order)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark delivered')
    } finally {
      setMarking(false)
    }
  }

  // refresh order after review submitted
  const handleReviewed = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders/${id}`)
      setOrder(res.data)
    } catch (err) { console.error(err) }
  }

  if (loading) return (
    <div className="orderDetailPage">
      <p style={{ textAlign: 'center', color: '#61027b', padding: '3rem' }}>Loading order...</p>
    </div>
  )

  if (error || !order) return (
    <div className="orderDetailPage">
      <p style={{ textAlign: 'center', color: 'red', padding: '3rem' }}>{error || 'Order not found'}</p>
    </div>
  )

  const isSeller    = user?.id === order.seller_id
  const currentStep = STATUS_STEPS.indexOf(order.status)
  const canDeliver  = isSeller && order.status === 'paid'

  return (
    <div className="orderDetailPage">

      {/* Header */}
      <div className="orderDetailHeader">
        <button className="backBtn" onClick={() => navigate(-1)}>
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </button>
        <h2>Order Details</h2>
      </div>

      {/* Status Timeline */}
      <div className="orderTimeline">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentStep
          const cfg  = STATUS_CONFIG[step]
          return (
            <React.Fragment key={step}>
              <div className="timelineStep">
                <div className="timelineIcon" style={{
                  background: done ? cfg.color : '#e2a9f1',
                  color: done ? '#fff' : '#aaa'
                }}>
                  {cfg.icon}
                </div>
                <p className="timelineLabel" style={{ color: done ? cfg.color : '#aaa' }}>
                  {cfg.label}
                </p>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className="timelineLine" style={{
                  background: i < currentStep ? '#17bf63' : '#e2a9f1'
                }} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Product Info */}
      <div className="orderDetailCard">
        <div className="orderDetailProduct">
          <div className="orderDetailImage">
            {order.image_url
              ? <img src={order.image_url} alt={order.product_name} />
              : <div className="orderImagePlaceholder" />
            }
          </div>
          <div className="orderDetailProductInfo">
            <p className="orderDetailProductName">{order.product_name}</p>
            <p className="orderDetailCategory">{order.category}</p>
            <p className="orderDetailPrice">₦{Number(order.price).toLocaleString()} × {order.quantity}</p>
            <p className="orderDetailTotal">Total: ₦{Number(order.amount).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Buyer / Seller Card */}
      <div className="orderDetailCard">
        <div className="orderPartyRow">
          <div className="orderParty">
            <p className="orderPartyLabel">Buyer</p>
            <div className="orderPartyUser">
              <UserAvatar avatar_url={order.buyer_avatar} size={36} />
              <div>
                <p className="orderPartyName">{order.buyer_name}</p>
                <p className="orderPartyUsername">@{order.buyer_username}</p>
              </div>
            </div>
          </div>
          <StorefrontOutlinedIcon sx={{ color: '#e2a9f1', fontSize: 28 }} />
          <div className="orderParty">
            <p className="orderPartyLabel">Seller</p>
            <div className="orderPartyUser">
              <UserAvatar avatar_url={order.seller_avatar} size={36} />
              <div>
                <p className="orderPartyName">{order.seller_name}</p>
                <p className="orderPartyUsername">@{order.seller_username}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Meta */}
      <div className="orderDetailCard orderMeta">
        <div className="orderMetaRow">
          <span>Order ID</span>
          <span className="orderMetaVal">{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="orderMetaRow">
          <span>Date</span>
          <span className="orderMetaVal">{new Date(order.created_at).toLocaleDateString('en-NG', {
            day: 'numeric', month: 'long', year: 'numeric'
          })}</span>
        </div>
        <div className="orderMetaRow">
          <span>Status</span>
          <span className="orderMetaVal" style={{ color: STATUS_CONFIG[order.status]?.color, fontWeight: 700 }}>
            {STATUS_CONFIG[order.status]?.label}
          </span>
        </div>
        {order.delivered_at && (
          <div className="orderMetaRow">
            <span>Delivered</span>
            <span className="orderMetaVal">{new Date(order.delivered_at).toLocaleDateString('en-NG', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}</span>
          </div>
        )}
      </div>

      {/* Seller Action */}
      {canDeliver && (
        <button className="markDeliveredBtn" onClick={handleMarkDelivered} disabled={marking}>
          <LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />
          {marking ? 'Marking...' : 'Mark as Delivered'}
        </button>
      )}

      {error && <p style={{ color: 'red', textAlign: 'center', fontSize: '13px' }}>{error}</p>}

      {/* Review Section */}
      <ReviewSection
        order={order}
        user={user}
        onReviewed={handleReviewed}
      />

    </div>
  )
}