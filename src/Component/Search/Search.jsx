import React, { useState, useEffect, useRef } from "react";
import './Search.css';
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import SearchSharpIcon from "@mui/icons-material/SearchSharp";
import UserAvatar from "../Common/UserAvatar";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import TagIcon from "@mui/icons-material/Tag";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import { API_URL } from "../Authentication/Authentication";
import { useAuth } from "../Context/AuthContext";
import PostCard from "../Home/PostCard";

// ── CartCard — now uses real product data ─────────────────────────────────────
function CartCard({ product }) {
  const navigate = useNavigate()
  if (!product) return null
  return (
    <div className="cart-Card" onClick={() => navigate(`/product/${product.id}`)}
      style={{ cursor: "pointer" }}>
      <div className="cartOwner">
        <UserAvatar avatar_url={product.avatar_url} size={24} />
        <div className="UserandRatings">
          <p>{product.business_name || product.username}</p>
          <p style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11 }}>
            <StarIcon sx={{ fontSize: 12, color: "#f5a623" }} />
            {product.avg_rating > 0 ? Number(product.avg_rating).toFixed(1) : "New"}
          </p>
        </div>
      </div>
      <div className="goodsImage">
        {product.image_url && (
          <img src={product.image_url} alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
        )}
      </div>
      <div className="goodsInfo">
        <p className="about">{product.name}</p>
        <p className="Price">₦{Number(product.price).toLocaleString()}</p>
        {product.fake_price && (
          <p className="fakePrice">₦{Number(product.fake_price).toLocaleString()}</p>
        )}
        <p className="UnitLeft">{product.units_left} units left</p>
      </div>
    </div>
  )
}

// ── LuckyPick — now uses real products from DB ────────────────────────────────
function LuckyPick({ products }) {
  const [current, setCurrent] = useState(0)
  const prev = () => setCurrent(i => (i === 0 ? products.length - 1 : i - 1))
  const next = () => setCurrent(i => (i === products.length - 1 ? 0 : i + 1))

  if (!products || products.length === 0) return (
    <div className="luckyPickContainer">
      <h2 className="sectionTitle">Lucky Pick</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
        No products available yet.
      </p>
      <NavLink to="/Cart" className="seeMoreLink">See Marketplace →</NavLink>
    </div>
  )

  return (
    <div className="luckyPickContainer">
      <h2 className="sectionTitle">Lucky Pick</h2>
      <div className="carouselWrapper">
        <button className="carouselBtn" onClick={prev}>
          <ArrowBackIosIcon sx={{ fontSize: 16 }} />
        </button>
        {/* ── passing real product object ── */}
        <CartCard product={products[current]} />
        <button className="carouselBtn" onClick={next}>
          <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
        </button>
      </div>
      <NavLink to="/Cart" className="seeMoreLink">See more on Marketplace →</NavLink>
    </div>
  )
}

// ── VideosGrid — improved player ──────────────────────────────────────────────
function VideosGrid({ videos }) {
  const navigate = useNavigate()

  if (!videos || videos.length === 0) return (
    <div className="videosSection">
      <h2 className="sectionTitle">Videos</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No videos yet.</p>
    </div>
  )

  return (
    <div className="videosSection">
      <h2 className="sectionTitle">Videos</h2>
      <div className="videosGrid">
        {videos.map((v) => (
          <div key={v.id} className="videoCard"
            onClick={() => navigate(`/reels/${v.id}`)}>
            <video
              src={v.media_url}
              muted
              playsInline
              style={{
                width: "100%", height: "100%",
                objectFit: "cover", borderRadius: "0.5em",
                pointerEvents: "none"
              }}
            />
            <div className="videoOverlay"><span>▶</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Trending ──────────────────────────────────────────────────────────────────
function Trending({ items }) {
  const navigate = useNavigate()
  return (
    <div className="trending-Section">
      <h2 className="sectionTitle">Trending</h2>
      {items.length === 0 && (
        <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
          Nothing trending yet.
        </p>
      )}
      {items.map((item) => (
        <div key={item.id} className="trendCard"
          onClick={() => navigate(`/post/${item.id}`)} // ← navigate to actual post
          style={{ cursor: "pointer" }}>
          <p className="trendTitle">
            {item.post_text?.slice(0, 60)}{item.post_text?.length > 60 ? "..." : ""}
          </p>
          <div className="trendFooter">
            <UserAvatar avatar_url={item.avatar_url} size={20} />
            <span>@{item.username} · ❤️ {item.likes_count} · 💬 {item.comments_count}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── User Result Card ──────────────────────────────────────────────────────────
function UserCard({ user, authHeader, onFollowToggle }) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  const handleFollow = async (e) => {
    e.stopPropagation()
      if (!user) return navigate("/auth") 
    if (pending) return
    setPending(true)
    try {
      if (user.is_following) {
        await axios.delete(`${API_URL}/profile/${user.username}/follow`, { headers: authHeader })
      } else {
        await axios.post(`${API_URL}/profile/${user.username}/follow`, {}, { headers: authHeader })
      }
      onFollowToggle(user.id)
    } catch (err) { console.error(err) }
    finally { setPending(false) }
  }

  return (
    <div className="userResultCard" onClick={() => navigate(`/Profile/${user.username}`)}>
      <UserAvatar avatar_url={user.avatar_url} size={40} />
      <div className="userResultInfo">
        <strong>{user.name}</strong>
        <span>@{user.username}</span>
        {user.bio && <p className="userResultBio">{user.bio}</p>}
        <span className="userResultFollowers">{user.followers_count} followers</span>
      </div>
      <button
        className={`searchFollowBtn ${user.is_following ? "following" : ""}`}
        onClick={handleFollow} disabled={pending}>
        {user.is_following ? "Unfollow" : "Follow"}
      </button>
    </div>
  )
}

// ── Dropdown ──────────────────────────────────────────────────────────────────
function SearchDropdown({ results, query, onSelect, onClose }) {
  const navigate  = useNavigate()
  const { users, posts, trending, hashtags } = results
  const hasResults = users?.length || posts?.length || trending?.length || hashtags?.length

  if (!hasResults) return (
    <div className="searchDropdown">
      <p className="dropdownEmpty">No results for "<strong>{query}</strong>"</p>
    </div>
  )

  return (
    <div className="searchDropdown">
      {users?.length > 0 && (
        <div className="dropdownSection">
          <p className="dropdownLabel">
            <AccountCircleIcon sx={{ fontSize: 14 }} /> People
          </p>
          {users.map((u) => (
            <div key={u.id} className="dropdownItem"
              onClick={() => { navigate(`/Profile/${u.username}`); onClose() }}>
              <UserAvatar avatar_url={u.avatar_url} size={32} />
              <div className="dropdownItemText">
                <strong>{u.name}</strong>
                <span>@{u.username}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {hashtags?.length > 0 && (
        <div className="dropdownSection">
          <p className="dropdownLabel">
            <TagIcon sx={{ fontSize: 14 }} /> Hashtags
          </p>
          {hashtags.map((h, i) => (
            <div key={i} className="dropdownItem"
              onClick={() => { onSelect(h.tag); onClose() }}>
              <div className="dropdownHashIcon">#</div>
              <div className="dropdownItemText">
                <strong>{h.tag}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {trending?.length > 0 && (
        <div className="dropdownSection">
          <p className="dropdownLabel">
            <WhatshotIcon sx={{ fontSize: 14 }} /> Trending
          </p>
          {trending.map((t) => (
            <div key={t.id} className="dropdownItem"
              onClick={() => { onSelect(t.post_text); onClose() }}>
              <WhatshotIcon sx={{ fontSize: 28, color: "#ff6b35" }} />
              <div className="dropdownItemText">
                <strong>{t.post_text?.slice(0, 50)}{t.post_text?.length > 50 ? "..." : ""}</strong>
                <span>@{t.username} · ❤️ {t.likes_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {posts?.length > 0 && (
        <div className="dropdownSection">
          <p className="dropdownLabel">
            <ArticleOutlinedIcon sx={{ fontSize: 14 }} /> Posts
          </p>
          {posts.map((p) => (
            <div key={p.id} className="dropdownItem"
              onClick={() => { onSelect(p.post_text); onClose() }}>
              <ArticleOutlinedIcon sx={{ fontSize: 28, color: "var(--border)" }} />
              <div className="dropdownItemText">
                <strong>{p.post_text?.slice(0, 50)}{p.post_text?.length > 50 ? "..." : ""}</strong>
                <span>@{p.username}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Search ───────────────────────────────────────────────────────────────
function Search() {
  const { getValidToken, user } = useAuth()
  const navigate          = useNavigate()

  const [query,        setQuery]        = useState("")
  const [searching,    setSearching]    = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdown,     setDropdown]     = useState({})
  const [users,        setUsers]        = useState([])
  const [posts,        setPosts]        = useState([])
  const [videos,       setVideos]       = useState([])
  const [trending,     setTrending]     = useState([])
  const [products,     setProducts]     = useState([]) // ← real products for lucky pick
  const [hasSearched,  setHasSearched]  = useState(false)

  const debounceRef = useRef(null)
  const wrapperRef  = useRef(null)

  // ── load discover data + real products on mount ───────────────────────────
 useEffect(() => {
  const fetchDiscover = async () => {
    try {
      let token = null
      try { token = await getValidToken() } catch {}
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const [discoverRes, productsRes, trendingRes] = await Promise.all([
        axios.get(`${API_URL}/search/discover`, { headers }),
        axios.get(`${API_URL}/products`, { headers }),
        axios.get(`${API_URL}/posts/trending`, { headers }) // ← same as home
      ])

      setVideos(discoverRes.data.videos)
      setTrending(trendingRes.data.trending_posts) // ← real trending

      const grouped = productsRes.data.products
      const flat = Object.values(grouped).flat()
      const shuffled = flat.sort(() => Math.random() - 0.5)
      setProducts(shuffled)

    } catch (err) { console.error(err) }
  }
  fetchDiscover()
}, [])

  // ── debounced autocomplete ─────────────────────────────────────────────────
 useEffect(() => {
  if (!query.trim()) { setShowDropdown(false); setDropdown({}); return }
  clearTimeout(debounceRef.current)
  debounceRef.current = setTimeout(async () => {
    try {
      let token = null
      try { token = await getValidToken() } catch {}
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const res = await axios.get(
        `${API_URL}/search/autocomplete?q=${encodeURIComponent(query)}`,
        { headers }
      )
      setDropdown(res.data.results)
      setShowDropdown(true)
    } catch (err) { console.error(err) }
  }, 300)
  return () => clearTimeout(debounceRef.current)
}, [query])

  // ── close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // ── full search ────────────────────────────────────────────────────────────
  const handleSearch = async () => {
     if (!user) return navigate("/auth") //I added this
    if (!query.trim()) return
    setShowDropdown(false)
    setSearching(true)
    try {
      const token = await getValidToken()
      const res = await axios.get(
        `${API_URL}/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setUsers(res.data.users)
      setPosts(res.data.posts)
      setVideos(res.data.videos)
      setTrending(res.data.trending)
      setHasSearched(true)
    } catch (err) { console.error(err) }
    finally { setSearching(false) }
  }

  const handleFollowToggle = (userId) => {
    setUsers((prev) => prev.map((u) =>
      u.id === userId
        ? { ...u, is_following: !u.is_following,
            followers_count: u.is_following ? u.followers_count - 1 : u.followers_count + 1 }
        : u
    ))
  }

  const handleLikeToggle = async (post) => {
     if (!user) return navigate("/auth")
    const liked = post.liked_by_me
    try {
      const token = await getValidToken()
      const headers = { Authorization: `Bearer ${token}` }
      liked
        ? await axios.delete(`${API_URL}/posts/${post.id}/like`, { headers })
        : await axios.post(`${API_URL}/posts/${post.id}/like`, {}, { headers })
      setPosts((prev) => prev.map((p) =>
        p.id === post.id
          ? { ...p, liked_by_me: !liked, likes_count: liked ? p.likes_count - 1 : p.likes_count + 1 }
          : p
      ))
    } catch (err) { console.error(err) }
  }

  const handleRepostToggle = async (post) => {
    const reposted = post.reposted_by_me
    try {
      const token = await getValidToken()
      const headers = { Authorization: `Bearer ${token}` }
      reposted
        ? await axios.delete(`${API_URL}/posts/${post.id}/repost`, { headers })
        : await axios.post(`${API_URL}/posts/${post.id}/repost`, {}, { headers })
      setPosts((prev) => prev.map((p) =>
        p.id === post.id
          ? { ...p, reposted_by_me: !reposted, reposts_count: reposted ? p.reposts_count - 1 : p.reposts_count + 1 }
          : p
      ))
    } catch (err) { console.error(err) }
  }

  const handleBookmarkToggle = async (post) => {
    const bookmarked = post.bookmarked_by_me
    try {
      const token = await getValidToken()
      const headers = { Authorization: `Bearer ${token}` }
      bookmarked
        ? await axios.delete(`${API_URL}/posts/${post.id}/bookmark`, { headers })
        : await axios.post(`${API_URL}/posts/${post.id}/bookmark`, {}, { headers })
      setPosts((prev) => prev.map((p) =>
        p.id === post.id
          ? { ...p, bookmarked_by_me: !bookmarked, bookmarks_count: bookmarked ? p.bookmarks_count - 1 : p.bookmarks_count + 1 }
          : p
      ))
    } catch (err) { console.error(err) }
  }

  return (
    <div className="searchGridContainer">

      {/* ── Search Bar — filter panel removed ── */}
      <div className="InputContainer">
        <div className="search-wrapper" ref={wrapperRef}>
          <div className="search-bar-row">
            <input
              type="text"
              placeholder="Search people, posts, hashtags..."
              className="main-input"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHasSearched(false) }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => query.trim() && setShowDropdown(true)}
              autoComplete="off"
            />
            {query && (
              <button className="clear-btn"
                onClick={() => { setQuery(""); setShowDropdown(false); setHasSearched(false) }}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </button>
            )}
            <button className="search-go" onClick={handleSearch} disabled={searching}>
              {searching
                ? <span style={{ fontSize: 12 }}>...</span>
                : <SearchSharpIcon sx={{ fontSize: 24 }} />
              }
            </button>
          </div>

          {/* ── autocomplete dropdown ── */}
          {showDropdown && (
            <SearchDropdown
              results={dropdown}
              query={query}
              onSelect={(text) => { setQuery(text); handleSearch() }}
              onClose={() => setShowDropdown(false)}
            />
          )}
        </div>
      </div>

      {/* ── Search Results ── */}
      {hasSearched && (
        <div className="searchResults">
          {users.length > 0 && (
            <div className="resultSection">
              <h3 className="resultHeading">People</h3>
              {users.map((u) => (
                <UserCard key={u.id} user={u}
                  authHeader={{ Authorization: `Bearer ${localStorage.getItem("token")}` }}
                  onFollowToggle={handleFollowToggle} />
              ))}
            </div>
          )}
          {posts.length > 0 && (
            <div className="resultSection">
              <h3 className="resultHeading">Posts</h3>
              {posts.map((post) => (
                <PostCard key={post.id} post={post}
                  onLikeToggle={handleLikeToggle}
                  onRepostToggle={handleRepostToggle}
                  onBookmarkToggle={handleBookmarkToggle} />
              ))}
            </div>
          )}
          {users.length === 0 && posts.length === 0 && (
            <p style={{
              color: "var(--text-secondary)", textAlign: "center",
              padding: "2rem", gridColumn: "span 3"
            }}>
              No results for "<strong>{query}</strong>"
            </p>
          )}
        </div>
      )}

      {/* ── Default Discover ── */}
      {!hasSearched && (
        <>
          {/* ── lucky pick now uses real products ── */}
          <LuckyPick products={products} />
          <VideosGrid videos={videos} />
          <Trending items={trending} />
        </>
      )}

    </div>
  )
}

export default Search