import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import StarIcon from "@mui/icons-material/Star"
import StarBorderIcon from "@mui/icons-material/StarBorder"
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined"
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined"
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined"
import RemoveIcon from "@mui/icons-material/Remove"
import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"
import { useAuth } from "../Context/AuthContext"
import { API_URL } from "../Authentication/Authentication"
import UserAvatar from "../Common/UserAvatar"
import "./ProductDetail.css"

// ── Buy Confirmation Modal ────────────────────────────────────────────────────
function BuyModal({ product, quantity, onClose, onConfirm, balance, loading }) {
  const total = Number(product.price) * quantity

  return (
    <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modalBox">
        <div className="modalTopRow">
          <h2>Confirm Purchase</h2>
          <button className="modalCloseBtn" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Product summary */}
        <div className="buyProductSummary">
          {product.image_url && (
            <img src={product.image_url} alt={product.name}
              style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} />
          )}
          <div>
            <p style={{ fontWeight: 600, color: "#2d002d", margin: 0 }}>{product.name}</p>
            <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>
              Qty: {quantity} × ₦{Number(product.price).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="buyBreakdown">
          <div className="buyBreakdownRow">
            <span>Subtotal</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
          <div className="buyBreakdownRow">
            <span>Wallet Balance</span>
            <span style={{ color: Number(balance) >= total ? "#17bf63" : "#e53935" }}>
              ₦{Number(balance).toLocaleString()}
            </span>
          </div>
          <div className="buyBreakdownRow total">
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
        </div>

        {Number(balance) < total && (
          <p style={{ color: "#e53935", fontSize: "13px", textAlign: "center" }}>
            Insufficient wallet balance. Please top up first.
          </p>
        )}

        {/* Escrow notice */}
        <div className="escrowNotice">
          <VerifiedOutlinedIcon sx={{ fontSize: 16, color: "#61027b" }} />
          <p>Your payment is held securely in escrow and only released to the seller after delivery is confirmed.</p>
        </div>

        <div className="modalBtns">
          <button className="cancelBtn" onClick={onClose}>Cancel</button>
          <button
            className="submitBtn"
            onClick={onConfirm}
            disabled={loading || Number(balance) < total}
          >
            {loading ? "Processing..." : "Confirm Purchase"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Product Detail ───────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  // const { token, user } = useAuth()
  // const authHeader = { Authorization: `Bearer ${token}` }

  const [product,  setProduct]  = useState(null)
  const [reviews,  setReviews]  = useState([])
  const [balance,  setBalance]  = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [showBuy,  setShowBuy]  = useState(false)
  const [buying,   setBuying]   = useState(false)
  const [error,    setError]    = useState("")

 const { user, getValidToken } = useAuth()

useEffect(() => {
  const fetchAll = async () => {
    try {
      const freshToken = await getValidToken()
      if (!freshToken) return
      const headers = { Authorization: `Bearer ${freshToken}` }

      const [productRes, balanceRes] = await Promise.all([
        axios.get(`${API_URL}/products/${id}`, { headers }),
        axios.get(`${API_URL}/wallet/balance`,  { headers }),
      ])
      setProduct(productRes.data.product)
      setBalance(balanceRes.data.balance)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  fetchAll()
}, [id])

const handleBuy = async () => {
  setBuying(true)
  setError("")
  try {
    const freshToken = await getValidToken()
    const res = await axios.post(
      `${API_URL}/orders/create`,
      { product_id: id, quantity },
      { headers: { Authorization: `Bearer ${freshToken}` } }
    )
    navigate(`/order/${res.data.order.id}`)
  } catch (err) {
    setError(err.response?.data?.error || "Purchase failed")
    setBuying(false)
  }
}

  if (loading) return (
    <div className="productDetailPage">
      <p style={{ textAlign: "center", padding: "2rem", color: "#61027b" }}>Loading...</p>
    </div>
  )

  if (!product) return (
    <div className="productDetailPage">
      <p style={{ textAlign: "center", padding: "2rem", color: "#888" }}>Product not found.</p>
    </div>
  )

  const discountPct = product.fake_price
    ? Math.round((1 - product.price / product.fake_price) * 100)
    : null

  return (
    <div className="productDetailPage">

      {/* ── Header ── */}
      <div className="productDetailHeader">
        <button className="backBtn" onClick={() => navigate("/Cart")}>
          <ArrowBackIcon fontSize="small" />
        </button>
        <h2>Product</h2>
      </div>

      {/* ── Image ── */}
      <div className="productDetailImage">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} />
          : <div className="noImage">No Image</div>
        }
        {discountPct && (
          <div className="discountBadge">-{discountPct}%</div>
        )}
      </div>

      {/* ── Info ── */}
      <div className="productDetailBody">

        {/* Name + Price */}
        <div className="productDetailTop">
          <h1 className="productDetailName">{product.name}</h1>
          <div className="productDetailPricing">
            <p className="productDetailPrice">₦{Number(product.price).toLocaleString()}</p>
            {product.fake_price && (
              <p className="productDetailFakePrice">
                ₦{Number(product.fake_price).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="productDetailRating">
          {[1,2,3,4,5].map((s) => (
            s <= Math.round(product.avg_rating)
              ? <StarIcon key={s} sx={{ fontSize: 18, color: "#f5a623" }} />
              : <StarBorderIcon key={s} sx={{ fontSize: 18, color: "#f5a623" }} />
          ))}
          <span>{Number(product.avg_rating).toFixed(1)} ({product.review_count} reviews)</span>
        </div>

        {/* Units */}
        <p className="productDetailUnits">
          {product.units_left > 0
            ? `${product.units_left} units available`
            : "Out of stock"
          }
        </p>

        {/* Description */}
        {product.description && (
          <div className="productDetailSection">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>
        )}

        {/* Seller */}
        <div className="productDetailSection">
          <h3>Seller</h3>
          <div className="sellerCard"
  onClick={() => navigate(
    product.business_name
      ? `/shop/${product.business_name.toLowerCase().replace(/ /g, "-")}`
      : `/profile/${product.username}`
  )}>
            <UserAvatar avatar_url={product.avatar_url} size={44} />
            <div className="sellerInfo">
              <strong>{product.business_name || product.seller_name}</strong>
              <span>@{product.username}</span>
              <span className="sellerCategory">{product.business_category}</span>
            </div>
            <StorefrontOutlinedIcon sx={{ color: "#61027b", marginLeft: "auto" }} />
          </div>
        </div>

        {/* Trust badges */}
        <div className="trustBadges">
          <div className="trustBadge">
            <VerifiedOutlinedIcon sx={{ fontSize: 18, color: "#61027b" }} />
            <span>Escrow Protected</span>
          </div>
          <div className="trustBadge">
            <LocalShippingOutlinedIcon sx={{ fontSize: 18, color: "#61027b" }} />
            <span>QR Delivery Scan</span>
          </div>
        </div>

        {/* Quantity selector */}
        {product.units_left > 0 && (
          <div className="quantitySelector">
            <p>Quantity</p>
            <div className="quantityControls">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <RemoveIcon fontSize="small" />
              </button>
              <span>{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.units_left, q + 1))}
                disabled={quantity >= product.units_left}
              >
                <AddIcon fontSize="small" />
              </button>
            </div>
          </div>
        )}

        {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}

        {/* Buy button */}
        <button
          className="buyNowBtn"
          onClick={() => setShowBuy(true)}
          disabled={product.units_left === 0}
        >
          {product.units_left === 0 ? "Out of Stock" : `Buy Now — ₦${(Number(product.price) * quantity).toLocaleString()}`}
        </button>

      </div>

      {/* ── Buy Modal ── */}
      {showBuy && (
        <BuyModal
          product={product}
          quantity={quantity}
          balance={balance}
          loading={buying}
          onClose={() => setShowBuy(false)}
          onConfirm={handleBuy}
        />
      )}
    </div>
  )
}