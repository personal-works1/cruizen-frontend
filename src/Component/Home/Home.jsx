import React, { useState, useEffect } from "react";
import "./home.css";
import welcome from "../../assets/welcome.jpg";
import duplex from "../../assets/duplex.jpg";
import livingroom from "../../assets/livingroom.jpg";
import axios from "axios";
import PostCard from "./PostCard";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom"
import UserAvatar from "../Common/UserAvatar"
import VerifiedIcon from "@mui/icons-material/Verified"
import StarIcon from "@mui/icons-material/Star"
import FanFavoriteBanner from "./FanFavoriteBanner";

import { useMode } from "../Context/modeContext";
import { useAuth } from "../Context/AuthContext";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CreatePostModal from "../Post/Post";
import { HeadingSmallDevice } from "../NavBar/Navbar";
import { API_URL } from "../Authentication/Authentication";



// const carouselData = [
//   { name: "username", img: welcome },
//   { name: "john_doe", img: duplex },
//   { name: "victor", img: livingroom },
// ];

// ── REPLACE the static MiniCarousel component at the top with: ────────
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

// ─── Single Post Card ────────────────────────────────────────────────────────


// ─── Home ────────────────────────────────────────────────────────────────────
function Home() {
  const [posts, setPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [trending, setTrending] = useState({ trending_posts: [], trending_words: [] })
const [trendingLoading, setTrendingLoading] = useState(true)
// const {user} =useAuth()

  // const token = localStorage.getItem("token");
  // const authHeader = { Authorization: `Bearer ${token}` };
  const { activeIdentity } = useMode()
  const [recommended, setRecommended] = useState([])
 const { user: me, getValidToken, loading: authLoading } = useAuth()

// ── feed ──────────────────────────────────────────────────────────────
useEffect(() => {
  if (authLoading) return // ← guard
  const fetchFeed = async () => {
    try {
      let token = null
      try { token = await getValidToken() } catch {}
      const res = await axios.get(`${API_URL}/posts/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setPosts(res.data.posts)
    } catch (err) {
      setFeedError("Failed to load posts.")
    } finally {
      setFeedLoading(false)
    }
  }
  fetchFeed()
}, [authLoading]) // ← add authLoading

// ── recommended ───────────────────────────────────────────────────────
// FIND the recommended useEffect and REPLACE WITH:
useEffect(() => {
  if (authLoading || !me) return
  const fetchRecommended = async () => {
    try {
      const token = await getValidToken()
      const res = await axios.get(`${API_URL}/products/recommended`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // ── if no recommendations, fetch random products as fallback ──
      if (res.data.products.length === 0) {
        const fallback = await axios.get(`${API_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        // flatten grouped products and take first 6
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
  // Prepend new post when created
const handleNewPost = (post) => {
  setPosts((prev) => [
    {
      ...post,
      // ── inject active identity instead of always personal ──────────
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
    },
    ...prev,
  ]);
};


  // Like / Unlike toggle
const handleLikeToggle = async (post) => {
  const token = await getValidToken()
const authHeader = { Authorization: `Bearer ${token}` }
  const liked = post.liked_by_me;
  try {
    if (liked) {
      await axios.delete(`${API_URL}/posts/${post.id}/like`, {
        headers: authHeader,
      });
    } else {
      await axios.post(
        `${API_URL}/posts/${post.id}/like`,
        {}, // ← this was missing, caused headers to be sent as body
        { headers: authHeader }
      );
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              liked_by_me: !liked,
              likes_count: liked
                ? Number(p.likes_count) - 1
                : Number(p.likes_count) + 1,
            }
          : p,
      ),
    );
  } catch (err) {
    console.error("Like error:", err);
  }
};
  const handleRepostToggle = async (post) => {
    const token = await getValidToken()
    const authHeader = { Authorization: `Bearer ${token}` }
        const reposted = post.reposted_by_me;
        try {
          if (reposted) {
            await axios.delete(`${API_URL}/posts/${post.id}/repost`, {
              headers: authHeader,
            });
          } else {
            await axios.post(
              `${API_URL}/posts/${post.id}/repost`,
              {},
              { headers: authHeader },
            );
          }
          setPosts((prev) =>
            prev.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    reposted_by_me: !reposted,
                    reposts_count: reposted
                      ? Number(p.reposts_count) - 1
                      : Number(p.reposts_count) + 1,
                  }
                : p,
            ),
          );
        } catch (err) {
          console.error("Repost error:", err);
        }
  };
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
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              bookmarked_by_me: !bookmarked,
              bookmarks_count: bookmarked        // ✅ update count locally
                ? Number(p.bookmarks_count) - 1
                : Number(p.bookmarks_count) + 1,
            }
          : p
      )
    )
  } catch (err) {
    console.error("Bookmark error:", err)
  }
}
const navigate = useNavigate()
const [topVendors,    setTopVendors]    = useState([])
const [topAccounts,   setTopAccounts]   = useState([])
const [sidebarLoading, setSidebarLoading] = useState(true)

// fetch sidebar data
// ── fixed version ─────────────────────────────────────────────────────
useEffect(() => {
  if (authLoading) return // ← wait for auth to finish loading

  const fetchSidebar = async () => {
    try {
      const token = await getValidToken()
      if (!token) return // ← no token, stop
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
}, [authLoading]) // ← re-runs when authLoading changes to false

// follow vendor
const handleVendorFollow = async (targetId) => {
  const vendor = topVendors.find(v => v.id === targetId)
  if (!vendor) return
  try {
    const token = await getValidToken()
    const headers = { Authorization: `Bearer ${token}` }

    // ── follow the SHOP not the personal account ──────────────────────
    // vendor.vendor_profile_id is the vendor_profiles.id
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

// follow account
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

  return (
    <>
      <HeadingSmallDevice />

      <div className="homeMain">
        {/* ── Left: Top Vendors & Accounts ── */}
        <div className="topAccSection">

  {/* ── Top Business ── */}
  <h1>Top Business</h1>
  <div className="topVendorSection">
    {topVendors.length === 0 && !sidebarLoading && (
      <p style={{ fontSize: '13px', color: '#888', padding: '0.5rem' }}>
        No vendors yet.
      </p>
    )}
    {topVendors.map((v) => (
      <div className="vendorAcc" key={v.id}>
        <div
          className="vendorProfileAccount"
         oonClick={() => navigate(`/shop/${v.id}`)}
          style={{ cursor: 'pointer' }}
        >
          <UserAvatar  avatar_url={v.avatar_url} size={42} />
          <div>
            <p className="pUsername" style={{ fontWeight: 600, fontSize: '13px',  margin: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
              {v.business_name || v.name}
              {v.is_verified && <VerifiedIcon sx={{ fontSize: 13, color: '#61027b' }} />}
            </p>
            <p style={{ fontSize: '11px', color: '#888', margin: 0, display: 'flex', alignItems: 'center', gap: '2px' }}>
              <StarIcon sx={{ fontSize: 11, color: '#f5a623' }} />
              {v.avg_rating > 0 ? Number(v.avg_rating).toFixed(1) : 'New'}
              · {v.completed_orders} orders
            </p>
          </div>
        </div>
        <div className="fllw-Icon-Btn">
          <button
            className={v.is_following ? 'followingBtn' : 'followBtn'}
            onClick={() => handleVendorFollow(v.id)}
          >
            {v.is_following ? 'Following' : 'Follow'}
          </button>
          {/* <ShoppingCartIcon
            sx={{ fontSize: 28, color: '#61027b', cursor: 'pointer' }}
            onClick={() => navigate(`/profile/${v.username}`)}
          /> */}
        </div>
      </div>
    ))}
  </div>

  {/* ── Top Accounts ── */}
  <h1>Top Account</h1>
  <div className="topVendorSection">
    {topAccounts.length === 0 && !sidebarLoading && (
      <p style={{ fontSize: '13px', color: '#888', padding: '0.5rem' }}>
        No accounts yet.
      </p>
    )}
    {topAccounts.map((a) => (
      <div className="vendorAcc" key={a.id}>
        <div
          className="vendorProfileAccount"
          onClick={() => navigate(`/profile/${a.username}`)}
          style={{ cursor: 'pointer' }}
        >
          <UserAvatar avatar_url={a.avatar_url} size={42} />
          <div>
            <p className="pUsername" style={{ fontWeight: 600, fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
              {a.name}
              {a.is_verified && <VerifiedIcon sx={{ fontSize: 13, color: '#61027b' }} />}
            </p>
            <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>
              @{a.username} · {a.followers_count} followers
            </p>
          </div>
        </div>
        <div className="fllw-Icon-Btn">
          <button
            className={a.is_following ? 'followingBtn' : 'followBtn'}
            onClick={() => handleAccountFollow(a.id)}
          >
            {a.is_following ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>
    ))}
  </div>
</div>

        {/* ── Middle: Feed ── */}
        <div className="feedsSection">
          {feedLoading && (
            <p style={{ textAlign: "center" }}>Loading posts...</p>
          )}
          {feedError && (
            <p style={{ textAlign: "center", color: "red" }}>{feedError}</p>
          )}
          {!feedLoading && posts.length === 0 && (
            <p style={{ textAlign: "center" }}>No posts yet. Be the first!</p>
          )}

         {posts
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
    {/* ── inject recommended products strip after every 5th post ── */}
    {index > 0 && (index + 1) % 5 === 0 && recommended.length > 0 && (
      <div style={{
        background: "var(--bg-card)",
        borderRadius: "12px",
        border: "1.5px solid var(--border)",
        padding: "0.8rem",
        marginBottom: "0.8em"
      }}>
        <p style={{
          fontSize: "12px",
          color: "var(--text-secondary)",
          marginBottom: "0.5rem",
          fontWeight: 600
        }}>
          🛍️ Based on your purchases
        </p>
        <div style={{ display: "flex", gap: "0.8rem", overflowX: "auto", scrollbarWidth: "none" }}>
          {recommended.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/product/${p.id}`)}
              style={{
                flexShrink: 0,
                width: "130px",
                cursor: "pointer",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                overflow: "hidden",
                background: "var(--bg)"
              }}
            >
              {p.image_url
                ? <img src={p.image_url} alt={p.name}
                    style={{ width: "100%", height: "90px", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "90px", background: "var(--accent-light)" }} />
              }
              <div style={{ padding: "6px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                  {p.name}
                </p>
                <p style={{ fontSize: "11px", color: "var(--accent)", margin: 0, fontWeight: 700 }}>
                  ₦{Number(p.price).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </React.Fragment>
))}
        </div>

{/* ── Right: Trending ── */}
<div className="trendingSection">

  {/* ── What's happening ── */}
  <div>
    <h1>What's happening</h1>

    {trendingLoading && (
      <p style={{ fontSize: "13px", color: "var(--text-secondary)", padding: "0.5rem" }}>
        Loading...
      </p>
    )}

    {/* ── trending words ── */}
    {trending.trending_words.length > 0 && (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "1rem" }}>
        {trending.trending_words.map((w, i) => (
          <span key={i} style={{
            background: "var(--accent-light)",
            color: "var(--accent)",
            borderRadius: "20px",
            padding: "3px 10px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            border: "1px solid var(--accent-mid)"
          }}>
            #{w.word}
          </span>
        ))}
      </div>
    )}

    {/* ── trending posts ── */}
    {trending.trending_posts.map((post) => (
      <div
        key={post.id}
        className="trends"
        onClick={() => navigate(`/post/${post.id}`)}
        style={{ cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <UserAvatar avatar_url={post.avatar_url} size={28} />
          <div>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              {post.name}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>
              @{post.username}
            </p>
          </div>
        </div>
        <p style={{
          fontSize: "13px",
          color: "var(--text-primary)",
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
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

  {/* ── Mini Carousel — real products ── */}
  <div className="shortCartSection">
    <ShoppingCartIcon sx={{ fontSize: 50, color: "var(--accent)" }} />
    <MiniCarousel products={recommended} />
  </div>

</div>
      </div>

      {/* FAB */}
      <button
        className="fab-create"
        onClick={() => setShowCompose(true)}
        title="Create post"
      >
        <EditOutlinedIcon />
      </button>

      {showCompose && (
        <CreatePostModal
          onClose={() => setShowCompose(false)}
          onPostCreated={handleNewPost}
        />
      )}
    </>
  );
}

export default Home;
