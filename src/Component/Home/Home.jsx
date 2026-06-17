import React, { useState, useEffect, useRef, useCallback } from "react";
import "./home.css";
import axios from "axios";
import PostCard from "./PostCard";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useNavigate } from "react-router-dom";
import UserAvatar from "../Common/UserAvatar";
import VerifiedIcon from "@mui/icons-material/Verified";
import StarIcon from "@mui/icons-material/Star";
import FanFavoriteBanner from "./FanFavoriteBanner";

import { useMode } from "../Context/modeContext";
import { useAuth } from "../Context/AuthContext";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CreatePostModal from "../Post/Post";
import { HeadingSmallDevice } from "../NavBar/Navbar";
import { API_URL } from "../Authentication/Authentication";

// ─────────────────────────────────────────────────────────────────────────────
//  FEED CACHE
//  A plain object that lives outside the component so it survives navigation.
//  When you go to a profile and come back, the feed is still in memory —
//  no re-fetch needed.
//
//  Shape: { posts: [], page: number, hasMore: boolean, timestamp: number }
//  timestamp lets us expire the cache after 2 minutes so it never goes stale.
// ─────────────────────────────────────────────────────────────────────────────
const feedCache = {
  data: null,         // the cached posts array
  page: 1,            // which page we were on
  hasMore: true,      // were there more posts to load?
  timestamp: null,    // when was it last fetched?
}
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes in milliseconds

const isCacheValid = () =>
  feedCache.data &&
  feedCache.timestamp &&
  Date.now() - feedCache.timestamp < CACHE_TTL


// ─────────────────────────────────────────────────────────────────────────────
//  SKELETON LOADER
//  Renders N placeholder cards that match the shape of a real PostCard.
//  Uses a shimmer animation defined in home.css.
//  This makes the app FEEL faster — users see structure immediately
//  instead of a blank screen or a spinner.
// ─────────────────────────────────────────────────────────────────────────────
function PostSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-header">
        <div className="skeleton-avatar shimmer" />
        <div className="skeleton-lines">
          <div className="skeleton-line shimmer" style={{ width: "40%" }} />
          <div className="skeleton-line shimmer" style={{ width: "25%" }} />
        </div>
      </div>
      <div className="skeleton-line shimmer" style={{ width: "100%", height: "14px", marginBottom: "6px" }} />
      <div className="skeleton-line shimmer" style={{ width: "80%", height: "14px", marginBottom: "6px" }} />
      <div className="skeleton-line shimmer" style={{ width: "60%", height: "14px", marginBottom: "12px" }} />
      <div className="skeleton-media shimmer" />
      <div className="skeleton-footer">
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton-action shimmer" />
        ))}
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
//  MINI CAROUSEL
// ─────────────────────────────────────────────────────────────────────────────
function MiniCarousel({ products }) {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (products.length === 0) return
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % products.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [products.length])

  if (products.length === 0) return null

  return (
    <div className="mini-carousel">
      <div
        className="mini-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {products.map((item, i) => (
          <div
            className="mini-slide"
            key={item.id}
            onClick={() => navigate(`/product/${item.id}`)}
            style={{ cursor: "pointer" }}
          >
            {item.image_url
              ? <img src={item.image_url} alt={item.name} className="bg" />
              : <div className="bg" style={{ background: "var(--accent-light)" }} />
            }
            <div className="overlay">
              <div className="user">
                <UserAvatar avatar_url={item.avatar_url} size={32} />
                <span>{item.business_name || item.username}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#fff", fontWeight: 700 }}>
                ₦{Number(item.price).toLocaleString()}
              </div>
              <div className="dots">
                {products.map((_, d) => (
                  <span
                    key={d}
                    className={d === index ? "dot active" : "dot"}
                    onClick={(e) => { e.stopPropagation(); setIndex(d) }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
//  HOME
// ─────────────────────────────────────────────────────────────────────────────
function Home() {
  const [posts,          setPosts]          = useState([])
  const [feedLoading,    setFeedLoading]    = useState(true)   // first load
  const [loadingMore,    setLoadingMore]    = useState(false)  // subsequent pages
  const [feedError,      setFeedError]      = useState("")
  const [page,           setPage]           = useState(1)
  const [hasMore,        setHasMore]        = useState(true)   // are there more pages?
  const [showCompose,    setShowCompose]    = useState(false)
  const [trending,       setTrending]       = useState({ trending_posts: [], trending_words: [] })
  const [trendingLoading,setTrendingLoading]= useState(true)
  const [recommended,    setRecommended]    = useState([])
  const [topVendors,     setTopVendors]     = useState([])
  const [topAccounts,    setTopAccounts]    = useState([])
  const [sidebarLoading, setSidebarLoading] = useState(true)

  // ref to the invisible sentinel div at the bottom of the feed
  // IntersectionObserver watches this — when it becomes visible,
  // we know the user has scrolled to the bottom and we fetch the next page
  const bottomRef = useRef(null)

  const { activeIdentity }                  = useMode()
  const { user: me, getValidToken, loading: authLoading } = useAuth()
  const navigate                            = useNavigate()

  const POSTS_PER_PAGE = 10 // how many posts to load at a time


  // ── FETCH FEED ────────────────────────────────────────────────────────────
  // HOW PAGINATION WORKS:
  //   - First load: fetches page 1 (posts 1–10)
  //   - As user scrolls, IntersectionObserver fires → fetchMore() → page 2 (posts 11–20) etc.
  //   - Each response tells us if there are more posts via `hasMore` flag from backend
  //   - We APPEND new posts to the existing array instead of replacing it
  //
  // HOW CACHING WORKS:
  //   - Before fetching, we check feedCache — if it's less than 2 mins old, use it
  //   - After fetching, we save results into feedCache
  //   - When user navigates away and comes back, cache hit = no network request
  //   - Cache expires after 2 minutes so it never shows stale data for too long
  const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
    // ── cache check (first page only) ────────────────────────────────
    if (pageNum === 1 && isCacheValid()) {
      setPosts(feedCache.data)
      setPage(feedCache.page)
      setHasMore(feedCache.hasMore)
      setFeedLoading(false)
      return
    }

    // ── set the right loading state ───────────────────────────────────
    // first load → show skeletons (feedLoading)
    // subsequent pages → show "Loading more..." at bottom (loadingMore)
    if (pageNum === 1) setFeedLoading(true)
    else setLoadingMore(true)

    try {
      let token = null
      try { token = await getValidToken() } catch {}

      const res = await axios.get(`${API_URL}/posts/feed`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page:  pageNum,
          limit: POSTS_PER_PAGE,
        },
      })

      const newPosts = res.data.posts || []
      const more     = res.data.hasMore ?? newPosts.length === POSTS_PER_PAGE

      // ── append or replace ─────────────────────────────────────────
      // page 1 → replace entire feed
      // page 2+ → append to existing posts
      setPosts(prev => append ? [...prev, ...newPosts] : newPosts)
      setHasMore(more)
      setPage(pageNum)

      // ── save to cache (page 1 only — we cache the initial load) ──
      if (pageNum === 1) {
        feedCache.data      = newPosts
        feedCache.page      = pageNum
        feedCache.hasMore   = more
        feedCache.timestamp = Date.now()
      }

    } catch (err) {
      setFeedError("Failed to load posts.")
    } finally {
      setFeedLoading(false)
      setLoadingMore(false)
    }
  }, [authLoading, getValidToken])


  // ── INITIAL FEED LOAD ─────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return
    fetchFeed(1, false)
  }, [authLoading])


  // ── INFINITE SCROLL ───────────────────────────────────────────────────────
  // HOW IT WORKS:
  //   - There's an invisible <div ref={bottomRef}> at the very bottom of the feed
  //   - IntersectionObserver watches it
  //   - When it enters the viewport (user scrolled to bottom), we call fetchMore()
  //   - fetchMore increments the page and fetches the next batch
  //   - We stop when hasMore is false (backend says no more posts)
  useEffect(() => {
  if (!bottomRef.current) return
  if (!hasMore || feedLoading) return // ← don't even attach if nothing to load

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loadingMore) {
        setPage(prev => prev + 1) // ← only update page, don't call fetchFeed directly
      }
    },
    { threshold: 0.1 }
  )

  observer.observe(bottomRef.current)
  return () => observer.disconnect()
}, [hasMore, feedLoading, loadingMore]) // ← stable deps, no fetchFeed here

useEffect(() => {
  if (page === 1) return // ← initial load handled separately
  fetchFeed(page, true)
}, [page]) // ← only fires when page actually changes

  // ── RECOMMENDED PRODUCTS ──────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !me) return
    const fetchRecommended = async () => {
      try {
        const token = await getValidToken()
        const res = await axios.get(`${API_URL}/products/recommended`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data.products.length === 0) {
          const fallback = await axios.get(`${API_URL}/products`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const allProducts = Object.values(fallback.data.products).flat().slice(0, 6)
          setRecommended(allProducts)
        } else {
          setRecommended(res.data.products)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchRecommended()
  }, [authLoading, me])


  // ── TRENDING ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return
    const fetchTrending = async () => {
      try {
        const token = await getValidToken()
        const res = await axios.get(`${API_URL}/posts/trending`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setTrending(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setTrendingLoading(false)
      }
    }
    fetchTrending()
  }, [authLoading])


  // ── SIDEBAR ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return
    const fetchSidebar = async () => {
      try {
        const token = await getValidToken()
        if (!token) return
        const authHeader = { Authorization: `Bearer ${token}` }
        const [vendorsRes, accountsRes] = await Promise.all([
          axios.get(`${API_URL}/users/top-vendors`,  { headers: authHeader }),
          axios.get(`${API_URL}/users/top-accounts`, { headers: authHeader })
        ])
        setTopVendors(vendorsRes.data.vendors)
        setTopAccounts(accountsRes.data.accounts)
      } catch (err) {
        console.error(err)
      } finally {
        setSidebarLoading(false)
      }
    }
    fetchSidebar()
  }, [authLoading])


  // ── NEW POST (prepend to feed + update cache) ─────────────────────────────
  const handleNewPost = (post) => {
    const enriched = {
      ...post,
      username:         activeIdentity.username,
      name:             activeIdentity.name,
      avatar_url:       activeIdentity.avatar_url,
      author_type:      activeIdentity.type,
      real_username:    me?.username,
      liked_by_me:      false,
      reposted_by_me:   false,
      bookmarked_by_me: false,
      likes_count:      0,
      comments_count:   0,
      reposts_count:    0,
      bookmarks_count:  0,
    }
    setPosts(prev => {
      const updated = [enriched, ...prev]
      // keep cache in sync so navigating away and back still shows the new post
      if (feedCache.data) feedCache.data = updated
      return updated
    })
  }


  // ── LIKE TOGGLE ───────────────────────────────────────────────────────────
  const handleLikeToggle = async (post) => {
    const token = await getValidToken()
    const authHeader = { Authorization: `Bearer ${token}` }
    const liked = post.liked_by_me
    try {
      if (liked) {
        await axios.delete(`${API_URL}/posts/${post.id}/like`, { headers: authHeader })
      } else {
        await axios.post(`${API_URL}/posts/${post.id}/like`, {}, { headers: authHeader })
      }
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, liked_by_me: !liked, likes_count: liked ? Number(p.likes_count) - 1 : Number(p.likes_count) + 1 }
          : p
      ))
    } catch (err) {
      console.error("Like error:", err)
    }
  }


  // ── REPOST TOGGLE ─────────────────────────────────────────────────────────
  const handleRepostToggle = async (post) => {
    const token = await getValidToken()
    const authHeader = { Authorization: `Bearer ${token}` }
    const reposted = post.reposted_by_me
    try {
      if (reposted) {
        await axios.delete(`${API_URL}/posts/${post.id}/repost`, { headers: authHeader })
      } else {
        await axios.post(`${API_URL}/posts/${post.id}/repost`, {}, { headers: authHeader })
      }
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, reposted_by_me: !reposted, reposts_count: reposted ? Number(p.reposts_count) - 1 : Number(p.reposts_count) + 1 }
          : p
      ))
    } catch (err) {
      console.error("Repost error:", err)
    }
  }


  // ── BOOKMARK TOGGLE ───────────────────────────────────────────────────────
  const handleBookmarkToggle = async (post) => {
    const token = await getValidToken()
    const authHeader = { Authorization: `Bearer ${token}` }
    const bookmarked = post.bookmarked_by_me
    try {
      if (bookmarked) {
        await axios.delete(`${API_URL}/posts/${post.id}/bookmark`, { headers: authHeader })
      } else {
        await axios.post(`${API_URL}/posts/${post.id}/bookmark`, {}, { headers: authHeader })
      }
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, bookmarked_by_me: !bookmarked, bookmarks_count: bookmarked ? Number(p.bookmarks_count) - 1 : Number(p.bookmarks_count) + 1 }
          : p
      ))
    } catch (err) {
      console.error("Bookmark error:", err)
    }
  }


  // ── VENDOR FOLLOW ─────────────────────────────────────────────────────────
  const handleVendorFollow = async (targetId) => {
    const vendor = topVendors.find(v => v.id === targetId)
    if (!vendor) return
    try {
      const token = await getValidToken()
      const headers = { Authorization: `Bearer ${token}` }
      if (vendor.is_following) {
        await axios.delete(`${API_URL}/vendors/${vendor.vendor_profile_id}/follow`, { headers })
      } else {
        await axios.post(`${API_URL}/vendors/${vendor.vendor_profile_id}/follow`, {}, { headers })
      }
      setTopVendors(prev => prev.map(v =>
        v.id === targetId ? { ...v, is_following: !v.is_following } : v
      ))
    } catch (err) { console.error(err) }
  }


  // ── ACCOUNT FOLLOW ────────────────────────────────────────────────────────
  const handleAccountFollow = async (targetId) => {
    const token = await getValidToken()
    const authHeader = { Authorization: `Bearer ${token}` }
    const account = topAccounts.find(a => a.id === targetId)
    if (!account) return
    try {
      if (account.is_following) {
        await axios.delete(`${API_URL}/profile/${account.username}/follow`, { headers: authHeader })
      } else {
        await axios.post(`${API_URL}/profile/${account.username}/follow`, {}, { headers: authHeader })
      }
      setTopAccounts(prev => prev.map(a =>
        a.id === targetId ? { ...a, is_following: !a.is_following } : a
      ))
    } catch (err) { console.error(err) }
  }


  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <HeadingSmallDevice />

      <div className="homeMain">

        {/* ── Left sidebar ── */}
        <div className="topAccSection">
          <h1>Top Business</h1>
          <div className="topVendorSection">
            {topVendors.length === 0 && !sidebarLoading && (
              <p style={{ fontSize: "13px", color: "#888", padding: "0.5rem" }}>No vendors yet.</p>
            )}
            {topVendors.map((v) => (
              <div className="vendorAcc" key={v.id}>
                <div className="vendorProfileAccount" onClick={() => navigate(`/shop/${v.id}`)} style={{ cursor: "pointer" }}>
                  <UserAvatar avatar_url={v.avatar_url} size={42} />
                  <div>
                    <p className="pUsername" style={{ fontWeight: 600, fontSize: "13px", margin: 0, display: "flex", alignItems: "center", gap: "3px" }}>
                      {v.business_name || v.name}
                      {v.is_verified && <VerifiedIcon sx={{ fontSize: 13, color: "#61027b" }} />}
                    </p>
                    <p style={{ fontSize: "11px", color: "#888", margin: 0, display: "flex", alignItems: "center", gap: "2px" }}>
                      <StarIcon sx={{ fontSize: 11, color: "#f5a623" }} />
                      {v.avg_rating > 0 ? Number(v.avg_rating).toFixed(1) : "New"} · {v.completed_orders} orders
                    </p>
                  </div>
                </div>
                <div className="fllw-Icon-Btn">
                  <button className={v.is_following ? "followingBtn" : "followBtn"} onClick={() => handleVendorFollow(v.id)}>
                    {v.is_following ? "Following" : "Follow"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <h1>Top Account</h1>
          <div className="topVendorSection">
            {topAccounts.length === 0 && !sidebarLoading && (
              <p style={{ fontSize: "13px", color: "#888", padding: "0.5rem" }}>No accounts yet.</p>
            )}
            {topAccounts.map((a) => (
              <div className="vendorAcc" key={a.id}>
                <div className="vendorProfileAccount" onClick={() => navigate(`/profile/${a.username}`)} style={{ cursor: "pointer" }}>
                  <UserAvatar avatar_url={a.avatar_url} size={42} />
                  <div>
                    <p className="pUsername" style={{ fontWeight: 600, fontSize: "13px", margin: 0, display: "flex", alignItems: "center", gap: "3px" }}>
                      {a.name}
                      {a.is_verified && <VerifiedIcon sx={{ fontSize: 13, color: "#61027b" }} />}
                    </p>
                    <p style={{ fontSize: "11px", color: "#888", margin: 0 }}>
                      @{a.username} · {a.followers_count} followers
                    </p>
                  </div>
                </div>
                <div className="fllw-Icon-Btn">
                  <button className={a.is_following ? "followingBtn" : "followBtn"} onClick={() => handleAccountFollow(a.id)}>
                    {a.is_following ? "Following" : "Follow"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* ── Middle: Feed ── */}
        <div className="feedsSection">

          {/* ── SKELETON: shown on first load only ── */}
          {feedLoading && (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          )}

          {feedError && (
            <p style={{ textAlign: "center", color: "red" }}>{feedError}</p>
          )}

          {!feedLoading && posts.length === 0 && (
            <p style={{ textAlign: "center" }}>No posts yet. Be the first!</p>
          )}

          {!feedLoading && posts
            .filter(post => post && post.id)
            .map((post, index) => (
              <React.Fragment key={post.id}>
                <PostCard
                  post={post}
                  onLikeToggle={handleLikeToggle}
                  onRepostToggle={handleRepostToggle}
                  onBookmarkToggle={handleBookmarkToggle}
                  onDelete={(postId) => setPosts(prev => prev.filter(p => p.id !== postId))}
                />
                {index === 2 && <FanFavoriteBanner />}
                {index > 0 && (index + 1) % 5 === 0 && recommended.length > 0 && (
                  <div style={{
                    background: "var(--bg-card)", borderRadius: "12px",
                    border: "1.5px solid var(--border)", padding: "0.8rem", marginBottom: "0.8em"
                  }}>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>
                      🛍️ Based on your purchases
                    </p>
                    <div style={{ display: "flex", gap: "0.8rem", overflowX: "auto", scrollbarWidth: "none" }}>
                      {recommended.map(p => (
                        <div key={p.id} onClick={() => navigate(`/product/${p.id}`)}
                          style={{ flexShrink: 0, width: "130px", cursor: "pointer", borderRadius: "8px", border: "1px solid var(--border)", overflow: "hidden", background: "var(--bg)" }}>
                          {p.image_url
                            ? <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "90px", objectFit: "cover" }} />
                            : <div style={{ width: "100%", height: "90px", background: "var(--accent-light)" }} />
                          }
                          <div style={{ padding: "6px" }}>
                            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{p.name}</p>
                            <p style={{ fontSize: "11px", color: "var(--accent)", margin: 0, fontWeight: 700 }}>₦{Number(p.price).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))
          }

          {/* ── INFINITE SCROLL SENTINEL ──────────────────────────────────
              This invisible div sits at the bottom of the feed.
              IntersectionObserver watches it — when it becomes visible
              (user scrolled to bottom), we fetch the next page.
          ── */}
          <div ref={bottomRef} style={{ height: "1px" }} />

          {/* ── loading more indicator (not skeletons — feed already visible) ── */}
          {loadingMore && (
            <div style={{ display: "flex", justifyContent: "center", padding: "1rem", gap: "6px" }}>
              <div className="dot-pulse" />
              <div className="dot-pulse" style={{ animationDelay: "0.15s" }} />
              <div className="dot-pulse" style={{ animationDelay: "0.3s" }} />
            </div>
          )}

          {/* ── end of feed message ── */}
          {!hasMore && !feedLoading && posts.length > 0 && (
            <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "13px", padding: "1rem" }}>
              You're all caught up 🎉
            </p>
          )}
        </div>


        {/* ── Right: Trending ── */}
        <div className="trendingSection">
          <div>
            <h1>What's happening</h1>
            {trendingLoading && (
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", padding: "0.5rem" }}>Loading...</p>
            )}
            {trending.trending_words.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "1rem" }}>
                {trending.trending_words.map((w, i) => (
                  <span key={i} style={{
                    background: "var(--accent-light)", color: "var(--accent)",
                    borderRadius: "20px", padding: "3px 10px", fontSize: "12px",
                    fontWeight: 600, cursor: "pointer", border: "1px solid var(--accent-mid)"
                  }}>
                    #{w.word}
                  </span>
                ))}
              </div>
            )}
            {trending.trending_posts.map((post) => (
              <div key={post.id} className="trends" onClick={() => navigate(`/post/${post.id}`)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <UserAvatar avatar_url={post.display_avatar} size={28} />
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{post.display_name}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>{post.display_username}</p>
                  </div>
                </div>
                <p style={{
                  fontSize: "13px", color: "var(--text-primary)", margin: 0,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden"
                }}>
                  {post.post_text}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  🔥 {post.score} engagements
                </p>
              </div>
            ))}
            {!trendingLoading && trending.trending_posts.length === 0 && (
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", padding: "0.5rem" }}>
                No trending posts yet today.
              </p>
            )}
          </div>

          <div className="shortCartSection">
            <ShoppingCartIcon sx={{ fontSize: 50, color: "var(--accent)" }} />
            <MiniCarousel products={recommended} />
          </div>
        </div>

      </div>

      {/* FAB */}
      <button className="fab-create" onClick={() => setShowCompose(true)} title="Create post">
        <EditOutlinedIcon />
      </button>

      {showCompose && (
        <CreatePostModal
          onClose={() => setShowCompose(false)}
          onPostCreated={handleNewPost}
        />
      )}
    </>
  )
}

export default Home
