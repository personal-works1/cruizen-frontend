import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../Context/AuthContext"
import { API_URL } from "../Authentication/Authentication"
import UserAvatar from "../Common/UserAvatar"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import StarIcon from "@mui/icons-material/Star"
import StorefrontIcon from "@mui/icons-material/Storefront"
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined"
import VerifiedIcon from "@mui/icons-material/Verified"
import WhatsAppIcon from "@mui/icons-material/WhatsApp"
import InstagramIcon from "@mui/icons-material/Instagram"
import TrustCard from "../Profile/TrustCard"
import LinkIcon from "@mui/icons-material/Link"
import YouTubeIcon from "@mui/icons-material/YouTube"
import XIcon from "@mui/icons-material/X"
import MusicNoteIcon from "@mui/icons-material/MusicNote"
import GraphicEqIcon from "@mui/icons-material/GraphicEq"
import "./ShopPage.css"

export default function ShopPage({ vendorId: propVendorId, embedded = false }) {
  const { slug }          = useParams()
  const navigate          = useNavigate()
  const { user, getValidToken } = useAuth()

  const [shop,     setShop]     = useState(null)
  const [products, setProducts] = useState([])
  const [stats,    setStats]    = useState(null)
  const [reviews,  setReviews]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [activeTab, setActiveTab] = useState("products")
  const [following,     setFollowing]     = useState(false)
  const [followPending, setFollowPending] = useState(false)
  const [shopFollowers, setShopFollowers] = useState(0)

 useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getValidToken()
        const url = propVendorId
          ? `${API_URL}/vendors/shop/id/${propVendorId}`
          : `${API_URL}/vendors/shop/${slug}`
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setShop(res.data.vendor)
        setProducts(res.data.products)
        setStats(res.data.stats)
        setReviews(res.data.reviews)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [slug, propVendorId])
  useEffect(() => {
  if (shop) {
    setShopFollowers(shop.followers_count || 0)
    setFollowing(shop.is_following || false)
  }
}, [shop])

  // ── follow/unfollow the vendor's personal account ─────────────────────
  // still follows the user behind the business — but visitor never sees that
  const handleFollow = async () => {
  if (followPending || !user) return
  setFollowPending(true)
  try {
    const token = await getValidToken()
    const headers = { Authorization: `Bearer ${token}` }
    if (following) {
      await axios.delete(`${API_URL}/vendors/${shop.id}/follow`, { headers })
      setShopFollowers(prev => prev - 1)
    } else {
      await axios.post(`${API_URL}/vendors/${shop.id}/follow`, {}, { headers })
      setShopFollowers(prev => prev + 1)
    }
    setFollowing(!following)
  } catch (err) { console.error(err) }
  finally { setFollowPending(false) }
}

  // ── message the vendor ────────────────────────────────────────────────
const handleMessage = async () => {
  if (!user) { navigate("/usersignIn"); return }
  try {
    const token = await getValidToken()
    
    console.log("Creating conversation with:", {
      user2: shop.user_id,
      type: "business",
      vendor_id: shop.id
    })
    
    const res = await axios.post(
      `${API_URL}/messages/conversation`,
      { 
        user2: shop.user_id,
        type: "business",
        vendor_id: shop.id
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    console.log("Conversation returned:", res.data.conversation)
    
    navigate("/messages", { 
      state: { 
        openConversation: res.data.conversation,
        tab: "business"
      } 
    })
  } catch (err) { console.error(err) }
}
  // ── generate shop slug for sharing ───────────────────────────────────
  const shopSlug = shop?.business_username ||
    shop?.business_name?.toLowerCase().replace(/ /g, "-")
   
    

  if (loading) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#61027b" }}>
      Loading shop...
    </div>
  )

  if (!shop) return (
    <div style={{ textAlign: "center", padding: "3rem" }}>
      <StorefrontIcon sx={{ fontSize: 48, color: "#e2a9f1" }} />
      <p>Shop not found.</p>
      <button onClick={() => navigate(-1)} style={{
        background: "#61027b", color: "#fff", border: "none",
        borderRadius: "8px", padding: "8px 16px", cursor: "pointer"
      }}>Go Back</button>
    </div>
  )

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="shopPage">

      {/* ── Banner ── */}
      <div className="shopBanner">
        {shop.banner_url
          ? <img src={shop.banner_url} alt="banner" className="shopBannerImg" />
          : <div className="shopBannerPlaceholder" />
        }
        {!embedded && (
  <button className="shopBackBtn" onClick={() => navigate(-1)}>
    <ArrowBackIcon sx={{ fontSize: 20 }} />
  </button>
)}
      </div>
      

      {/* ── Shop Identity ── */}
      <div className="shopIdentity">
        <div className="shopAvatarWrap">
          {/* ── business avatar — no personal avatar ever shown ── */}
          <UserAvatar avatar_url={shop.avatar_url} size={90} />
        </div>

        <div className="shopInfo">
          <div className="shopNameRow">
            <h2 className="shopName">
              {shop.business_name}
              {/* ── verified badge ── */}
              {shop.is_verified && (
                <VerifiedIcon sx={{ fontSize: 18, color: "#61027b", marginLeft: "6px" }} />
              )}
            </h2>
          </div>

          {/* ── category tag ── */}
          <p className="shopCategory">
            <StorefrontIcon sx={{ fontSize: 14 }} /> {shop.business_category}
          </p>

          {/* ── rating ── */}
          {avgRating && (
            <p className="shopRating">
              <StarIcon sx={{ fontSize: 14, color: "#f5a623" }} />
              {avgRating} ({reviews.length} reviews)
            </p>
          )}

          {/* ── stats row ── */}
          <div className="shopStats">
            <div className="shopStat">
              <strong>{products.length}</strong>
              <span>Products</span>
            </div>
            <div className="shopStat">
              <strong>{stats?.completed_orders || 0}</strong>
              <span>Orders</span>
            </div>
            <div className="shopStat">
              <strong><strong>{shopFollowers}</strong></strong>
              <span>Followers</span>
            </div>
          </div>

          {/* ── action buttons ── */}
          {!embedded && user && user.id !== shop.user_id && (
            <div className="shopActions">
              <button
                className={`shopFollowBtn ${following ? "following" : ""}`}
                onClick={handleFollow}
                disabled={followPending}
              >
                {following ? "Following" : "Follow"}
              </button>
              <button className="shopMessageBtn" onClick={handleMessage}>
                Message
              </button>
            </div>
          )}

          {/* ── social links ── */}
    
<div className="shopSocialLinks">
  {shop.whatsapp && (
    <a href={shop.whatsapp} target="_blank" rel="noreferrer">
      <WhatsAppIcon sx={{ fontSize: 28, color: "var(--accent)" }} />
    </a>
  )}
  {shop.instagram && (
    <a href={shop.instagram} target="_blank" rel="noreferrer">
      <InstagramIcon sx={{ fontSize: 28, color: "var(--accent)" }} />
    </a>
  )}
  {shop.tiktok && (
    <a href={shop.tiktok} target="_blank" rel="noreferrer">
      <GraphicEqIcon sx={{ fontSize: 28, color: "var(--accent)" }} />
    </a>
  )}
  {shop.youtube && (
    <a href={shop.youtube} target="_blank" rel="noreferrer">
      <YouTubeIcon sx={{ fontSize: 28, color: "var(--accent)" }} />
    </a>
  )}
  {shop.x_twitter && (
    <a href={shop.x_twitter} target="_blank" rel="noreferrer">
      <XIcon sx={{ fontSize: 28, color: "var(--accent)" }} />
    </a>
  )}
  {shop.spotify && (
    <a href={shop.spotify} target="_blank" rel="noreferrer">
      <MusicNoteIcon sx={{ fontSize: 28, color: "var(--accent)" }} />
    </a>
  )}
  {shop.other_1_url && (
    <a href={shop.other_1_url} target="_blank" rel="noreferrer"
      style={{ display: "flex", alignItems: "center", gap: "4px",
               fontSize: "13px", color: "var(--accent)" }}>
      <LinkIcon sx={{ fontSize: 18 }} />
      {shop.other_1_label || "Link"}
    </a>
  )}
  {shop.other_2_url && (
    <a href={shop.other_2_url} target="_blank" rel="noreferrer"
      style={{ display: "flex", alignItems: "center", gap: "4px",
               fontSize: "13px", color: "var(--accent)" }}>
      <LinkIcon sx={{ fontSize: 18 }} />
      {shop.other_2_label || "Link"}
    </a>
  )}
</div>

        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="shopTabs">
        <button
          className={`shopTab ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          Products ({products.length})
        </button>
        <button
          className={`shopTab ${activeTab === "reviews" ? "active" : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews ({reviews.length})
        </button>
      </div>

      {/* ── Products Tab ── */}
      {activeTab === "products" && (
        <div className="shopProductsGrid">
          {products.length === 0 && (
            <p style={{ textAlign: "center", color: "#888", padding: "2rem", gridColumn: "span 2" }}>
              No products yet.
            </p>
          )}
          {products.map((p) => (
            <div
              key={p.id}
              className="shopProductCard"
              onClick={() => navigate(`/product/${p.id}`)}
            >
              {p.image_url
                ? <img src={p.image_url} alt={p.name} className="shopProductImg" />
                : <div className="shopProductImgPlaceholder" />
              }
              <div className="shopProductInfo">
                <p className="shopProductName">{p.name}</p>
                <p className="shopProductPrice">₦{Number(p.price).toLocaleString()}</p>
                {p.fake_price && (
                  <p className="shopProductFakePrice">₦{Number(p.fake_price).toLocaleString()}</p>
                )}
                <p className="shopProductUnits">{p.units_left} left</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Reviews Tab ── */}
      {activeTab === "reviews" && (
        <div className="shopReviews">
          
       <TrustCard vendorId={shop.id} />
          {reviews.length === 0 && (
            <p style={{ textAlign: "center", color: "#888", padding: "2rem" }}>
              No reviews yet.
            </p>
          )}
          {reviews.map((r, i) => (
            <div key={i} className="shopReviewItem">
              <div className="shopReviewTop">
                <UserAvatar avatar_url={r.reviewer_avatar} size={36} />
                <div>
                  <strong>{r.reviewer_name}</strong>
                  <p style={{ fontSize: "11px", color: "#888" }}>@{r.reviewer_username}</p>
                </div>
                <div className="shopReviewStars">
                  {[1,2,3,4,5].map((s) => (
                    <StarIcon key={s} sx={{
                      fontSize: 14,
                      color: s <= r.rating ? "#f5a623" : "#ddd"
                    }} />
                  ))}
                </div>
              </div>
              <p className="shopReviewText">{r.review_text}</p>
              <span className="shopReviewDate">
                {new Date(r.created_at).toLocaleDateString("en-NG", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}