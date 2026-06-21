import { useState, useEffect, useRef } from "react"
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
import CloseIcon from "@mui/icons-material/Close"
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import "./ShopPage.css"

function ShopEditForm({ shop, onSave, onClose }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    business_name:        shop.business_name        || "",
    business_description: shop.business_description || "",
    whatsapp:             shop.whatsapp             || "",
    instagram:            shop.instagram            || "",
    tiktok:               shop.tiktok               || "",
    youtube:              shop.youtube              || "",
    x_twitter:            shop.x_twitter            || "",
    spotify:              shop.spotify              || "",
    other_1_url:          shop.other_1_url          || "",
    other_1_label:        shop.other_1_label        || "",
    other_2_url:          shop.other_2_url          || "",
    other_2_label:        shop.other_2_label        || "",
  })

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <>
      <div className="field">
        <label>Business Name</label>
        <input name="business_name" value={form.business_name} onChange={handleChange} />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea name="business_description" value={form.business_description}
          onChange={handleChange} rows={3}
          placeholder="Tell customers what you sell..." />
      </div>

      <div style={{
        borderTop: "1px solid var(--border)", margin: "12px 0 8px",
        paddingTop: "8px", fontSize: "13px", color: "#888", fontWeight: 600,
      }}>
        Social Links
      </div>

      {[
        { name: "whatsapp",  label: "WhatsApp",    placeholder: "https://wa.me/234..." },
        { name: "instagram", label: "Instagram",   placeholder: "https://instagram.com/..." },
        { name: "tiktok",    label: "TikTok",      placeholder: "https://tiktok.com/@..." },
        { name: "youtube",   label: "YouTube",     placeholder: "https://youtube.com/..." },
        { name: "x_twitter", label: "X (Twitter)", placeholder: "https://x.com/..." },
        { name: "spotify",   label: "Spotify",     placeholder: "https://open.spotify.com/..." },
      ].map(({ name, label, placeholder }) => (
        <div className="field" key={name}>
          <label>{label}</label>
          <input name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} />
        </div>
      ))}

      <div className="field">
        <label>Other Link 1 — Label</label>
        <input name="other_1_label" value={form.other_1_label} onChange={handleChange} placeholder="e.g. My Podcast" />
      </div>
      <div className="field">
        <label>Other Link 1 — URL</label>
        <input name="other_1_url" value={form.other_1_url} onChange={handleChange} placeholder="https://..." />
      </div>
      <div className="field">
        <label>Other Link 2 — Label</label>
        <input name="other_2_label" value={form.other_2_label} onChange={handleChange} placeholder="e.g. My Linktree" />
      </div>
      <div className="field">
        <label>Other Link 2 — URL</label>
        <input name="other_2_url" value={form.other_2_url} onChange={handleChange} placeholder="https://..." />
      </div>

      <div className="modalBtns">
        <button className="cancelBtn" onClick={onClose}>Cancel</button>
        <button className="submitBtn" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </>
  )
}
function ShopPageSkeleton() {
  return (
    <div className="shopPage">
      <div className="shopBanner">
        <div className="skeletonLine shimmer" style={{ width: "100%", height: "100%" }} />
      </div>
      <div className="shopIdentity">
        <div className="skeletonAvatar shimmer" style={{ width: 90, height: 90, borderRadius: "50%" }} />
        <div className="shopInfo">
          <div className="skeletonLine shimmer" style={{ width: "140px", height: "20px", marginBottom: "8px" }} />
          <div className="skeletonLine shimmer" style={{ width: "100px", height: "14px", marginBottom: "8px" }} />
          <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="skeletonLine shimmer" style={{ width: "50px", height: "30px" }} />
            ))}
          </div>
        </div>
      </div>
      <div className="shopProductsGrid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeletonTile shimmer" style={{ height: "180px", borderRadius: "8px" }} />
        ))}
      </div>
    </div>
  );
}

const shopCache = new Map();
const SHOP_CACHE_TTL = 2 * 60 * 1000;

function getCachedShop(key) {
  const entry = shopCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > SHOP_CACHE_TTL) {
    shopCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedShop(key, data) {
  shopCache.set(key, { data, timestamp: Date.now() });
}

function clearShopCache(key) {
  shopCache.delete(key);
}

export default function ShopPage({ vendorId: propVendorId, embedded = false }) {
  const { slug }          = useParams()
  const navigate          = useNavigate()
  const { user} = useAuth()

  const [shop,     setShop]     = useState(null)
  const [products, setProducts] = useState([])
  const [stats,    setStats]    = useState(null)
  const [reviews,  setReviews]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [activeTab, setActiveTab] = useState("products")
  const [following,     setFollowing]     = useState(false)
  const [followPending, setFollowPending] = useState(false)
  const [shopFollowers, setShopFollowers] = useState(0)
 const shopAvatarInputRef = useRef(null)
const [avatarUploading, setAvatarUploading] = useState(false)
const [showEditModal, setShowEditModal] = useState(false)
useEffect(() => {
  const cacheKey = propVendorId || slug;

  const fetch = async () => {
    // 1. show cached instantly
    const cached = getCachedShop(cacheKey);
    if (cached) {
      setShop(cached.shop);
      setProducts(cached.products);
      setStats(cached.stats);
      setReviews(cached.reviews);
      setLoading(false);
    }

    // 2. revalidate in background
    try {
      const url = propVendorId
        ? `${API_URL}/vendors/shop/id/${propVendorId}`
        : `${API_URL}/vendors/shop/${slug}`;
      const res = await axios.get(url);
      setShop(res.data.vendor);
      setProducts(res.data.products);
      setStats(res.data.stats);
      setReviews(res.data.reviews);

      setCachedShop(cacheKey, {
        shop: res.data.vendor,
        products: res.data.products,
        stats: res.data.stats,
        reviews: res.data.reviews,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  fetch();
}, [slug, propVendorId]);
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
    if (following) {
      await axios.delete(`${API_URL}/vendors/${shop.id}/follow`)
      setShopFollowers(prev => prev - 1)
    } else {
      await axios.post(`${API_URL}/vendors/${shop.id}/follow`)
      setShopFollowers(prev => prev + 1)
    }
    setFollowing(!following)
    clearShopCache(propVendorId || slug);
  } catch (err) { console.error(err) }
  finally { setFollowPending(false) }
}

  // ── message the vendor ────────────────────────────────────────────────
const handleMessage = async () => {
  if (!user) { navigate("/usersignIn"); return }
  try {
    
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


const handleShopAvatarUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  setAvatarUploading(true)
  try {
    const formData = new FormData()
    formData.append("avatar", file)
    const res = await axios.post(`${API_URL}/vendors/avatar`, formData, {
      headers: {  "Content-Type": "multipart/form-data" },
    })
    setShop((prev) => ({ ...prev, avatar_url: res.data.avatar_url }))
    clearShopCache(propVendorId || slug);
  } catch (err) {
    alert(err.response?.data?.error || "Upload failed")
  } finally {
    setAvatarUploading(false)
    shopAvatarInputRef.current.value = ""
  }
}

const handleShopAvatarDelete = async () => {
  if (!window.confirm("Remove shop profile picture?")) return
  try {
    await axios.delete(`${API_URL}/vendors/avatar`)
    setShop((prev) => ({ ...prev, avatar_url: null }))
    clearShopCache(propVendorId || slug);
  } catch (err) {
    alert("Failed to remove photo")
  }
}

const handleShopSave = async (updatedData) => {
  try {

    await axios.put(`${API_URL}/vendors/update`, {
      business_name: updatedData.business_name,
      business_description: updatedData.business_description,
    })

    await axios.put(`${API_URL}/vendors/social-links`, {
      whatsapp:      updatedData.whatsapp,
      instagram:     updatedData.instagram,
      tiktok:        updatedData.tiktok,
      youtube:       updatedData.youtube,
      x_twitter:     updatedData.x_twitter,
      spotify:       updatedData.spotify,
      other_1_url:   updatedData.other_1_url,
      other_1_label: updatedData.other_1_label,
      other_2_url:   updatedData.other_2_url,
      other_2_label: updatedData.other_2_label,
    })

    setShop((prev) => ({ ...prev, ...updatedData }))
    clearShopCache(propVendorId || slug);
    setShowEditModal(false)
  } catch (err) {
    alert(err.response?.data?.error || "Save failed")
  }
}
  // ── generate shop slug for sharing ───────────────────────────────────
  const shopSlug = shop?.business_username ||
    shop?.business_name?.toLowerCase().replace(/ /g, "-")
   
    

  if (loading && !shop) return <ShopPageSkeleton />

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
      <div className="shopAvatarWrap" style={{ position: "relative" }}>
  <UserAvatar avatar_url={shop.avatar_url} size={90} />

  {embedded && user?.id === shop.user_id && (
    <div className="avatarActions">
      <button
        className="avatarUploadBtn"
        onClick={() => shopAvatarInputRef.current.click()}
        disabled={avatarUploading}
        title="Change photo"
      >
        {avatarUploading ? "..." : <AddAPhotoIcon sx={{ fontSize: 16 }} />}
      </button>
      {shop.avatar_url && (
        <button
          className="avatarDeleteBtn"
          onClick={handleShopAvatarDelete}
          title="Remove photo"
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </button>
      )}
    </div>
  )}

  <input
    ref={shopAvatarInputRef}
    type="file"
    accept="image/*"
    hidden
    onChange={handleShopAvatarUpload}
  />
</div>

        <div className="shopInfo">
         <div className="shopNameRow">
  <h2 className="shopName">
    {shop.business_name}
    {shop.is_verified && (
      <VerifiedIcon sx={{ fontSize: 18, color: "#61027b", marginLeft: "6px" }} />
    )}
  </h2>
  {embedded && user?.id === shop.user_id && (
    <button
      onClick={() => setShowEditModal(true)}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: "#61027b", padding: "4px",
      }}
    >
      <EditOutlinedIcon sx={{ fontSize: 20 }} />
    </button>
  )}
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
      {showEditModal && (
  <div
    className="modalOverlay"
    onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
  >
    <div className="modalBox">
      <div className="modalTopRow">
        <h2>Edit Business</h2>
        <button className="modalCloseBtn" onClick={() => setShowEditModal(false)}>
          <CloseIcon fontSize="small" />
        </button>
      </div>

      <ShopEditForm shop={shop} onSave={handleShopSave} onClose={() => setShowEditModal(false)} />
    </div>
  </div>
)}

    </div>
  )
}