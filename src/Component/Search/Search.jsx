import React, { useState, useEffect, useRef } from "react";
import "./Search.css";
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

// ── Discover cache (5 min TTL — products/trending don't change by the second) ─
const DISCOVER_CACHE_KEY = "search_discover_cache";
const DISCOVER_TTL = 5 * 60_000;

function getDiscoverCache() {
  try {
    const raw = sessionStorage.getItem(DISCOVER_CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > DISCOVER_TTL) {
      sessionStorage.removeItem(DISCOVER_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setDiscoverCache(data) {
  try {
    sessionStorage.setItem(
      DISCOVER_CACHE_KEY,
      JSON.stringify({ data, ts: Date.now() }),
    );
  } catch {}
}

// ── Skeleton primitives ───────────────────────────────────────────────────────
function SkelBox({ w = "100%", h = 14, radius = 6, style = {} }) {
  return (
    <div
      className="skelLine"
      style={{ width: w, height: h, borderRadius: radius, ...style }}
    />
  );
}

// LuckyPick skeleton
function LuckyPickSkeleton() {
  return (
    <div className="luckyPickContainer">
      <SkelBox w="80px" h={16} style={{ marginBottom: 8 }} />
      <div className="carouselWrapper">
        <div
          style={{ width: 32, height: 32, borderRadius: "50%" }}
          className="skelLine"
        />
        <div className="cart-Card" style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div className="skelCircle" style={{ width: 24, height: 24 }} />
            <SkelBox w="60%" h={12} />
          </div>
          <div
            className="skelLine"
            style={{ width: "100%", height: 120, borderRadius: 8 }}
          />
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <SkelBox w="70%" h={13} />
            <SkelBox w="40%" h={14} />
            <SkelBox w="30%" h={11} />
          </div>
        </div>
        <div
          style={{ width: 32, height: 32, borderRadius: "50%" }}
          className="skelLine"
        />
      </div>
    </div>
  );
}

// VideosGrid skeleton
function VideosGridSkeleton() {
  return (
    <div className="videosSection">
      <SkelBox w="60px" h={16} style={{ marginBottom: 10 }} />
      <div className="videosGrid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="skelLine"
            style={{ borderRadius: 8, height: 120 }}
          />
        ))}
      </div>
    </div>
  );
}

// Trending skeleton
function TrendingSkeleton() {
  return (
    <div className="trending-Section">
      <SkelBox w="70px" h={16} style={{ marginBottom: 10 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="trendCard"
          style={{ gap: 8, pointerEvents: "none" }}
        >
          <SkelBox w="90%" h={13} />
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div className="skelCircle" style={{ width: 20, height: 20 }} />
            <SkelBox w="50%" h={11} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CartCard ──────────────────────────────────────────────────────────────────
function CartCard({ product }) {
  const navigate = useNavigate();
  if (!product) return null;

  return (
    <div
      className="cart-Card"
      onClick={() => navigate(`/product/${product.id}`)}
      style={{ cursor: "pointer" }}
    >
      <div className="cartOwner">
        <UserAvatar
          avatar_url={product.display_avatar_url}
          size={24}
          variant="vendor"
        />
        <div className="UserandRatings">
          <p>{product.business_name}</p>
          <p
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              fontSize: 11,
            }}
          >
            <StarIcon sx={{ fontSize: 12, color: "#f5a623" }} />
            {product.avg_rating > 0
              ? Number(product.avg_rating).toFixed(1)
              : "New"}
          </p>
        </div>
      </div>
      <div className="goodsImage">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
        )}
      </div>
      <div className="goodsInfo">
        <p className="about">{product.name}</p>
        <p className="Price">₦{Number(product.price).toLocaleString()}</p>
        {product.fake_price && (
          <p className="fakePrice">
            ₦{Number(product.fake_price).toLocaleString()}
          </p>
        )}
        <p className="UnitLeft">{product.units_left} units left</p>
      </div>
    </div>
  );
}
// ── LuckyPick ─────────────────────────────────────────────────────────────────
function LuckyPick({ products, loading }) {
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((i) => (i === 0 ? products.length - 1 : i - 1));
  const next = () => setCurrent((i) => (i === products.length - 1 ? 0 : i + 1));

  if (loading) return <LuckyPickSkeleton />;

  if (!products || products.length === 0)
    return (
      <div className="luckyPickContainer">
        <h2 className="sectionTitle">Lucky Pick</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          No products available yet.
        </p>
        <NavLink to="/Cart" className="seeMoreLink">
          See Marketplace →
        </NavLink>
      </div>
    );

  return (
    <div className="luckyPickContainer">
      <h2 className="sectionTitle">Lucky Pick</h2>
      <div className="carouselWrapper">
        <button className="carouselBtn" onClick={prev}>
          <ArrowBackIosIcon sx={{ fontSize: 16 }} />
        </button>
        <CartCard product={products[current]} />
        <button className="carouselBtn" onClick={next}>
          <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
        </button>
      </div>
      <NavLink to="/Cart" className="seeMoreLink">
        See more on Marketplace →
      </NavLink>
    </div>
  );
}

// ── VideosGrid ────────────────────────────────────────────────────────────────
function VideosGrid({ videos, loading }) {
  const navigate = useNavigate();

  if (loading) return <VideosGridSkeleton />;

  if (!videos || videos.length === 0)
    return (
      <div className="videosSection">
        <h2 className="sectionTitle">Videos</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
          No videos yet.
        </p>
      </div>
    );

  return (
    <div className="videosSection">
      <h2 className="sectionTitle">Videos</h2>
      <div className="videosGrid">
        {videos.map((v) => (
          <div
            key={v.id}
            className="videoCard"
            onClick={() => navigate(`/reels/${v.id}`)}
          >
            <video
              src={v.media_url}
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "0.5em",
                pointerEvents: "none",
              }}
            />
            <div className="videoOverlay">
              <span>▶</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trending ──────────────────────────────────────────────────────────────────
function Trending({ items, loading }) {
  const navigate = useNavigate();

  if (loading) return <TrendingSkeleton />;

  return (
    <div className="trending-Section">
      <h2 className="sectionTitle">Trending</h2>
      {items.length === 0 && (
        <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Nothing trending yet.</p>
      )}
      {items.map((item) => (
        <div key={item.id} className="trendCard"
          onClick={() => navigate(`/post/${item.id}`)}
          style={{ cursor: "pointer" }}>
          <p className="trendTitle">
            {item.post_text?.slice(0, 60)}{item.post_text?.length > 60 ? "..." : ""}
          </p>
          <div className="trendFooter">
            <UserAvatar avatar_url={item.display_avatar} size={20} />
            <span>{item.display_name} </span>  
          </div>
        </div>
      ))}
    </div>
  );
}

// ── UserCard ──────────────────────────────────────────────────────────────────
function UserCard({ user, onFollowToggle }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!user) return navigate("/auth");
    if (pending) return;
    setPending(true);
    try {
      if (user.is_following) {
        await axios.delete(`${API_URL}/profile/${user.username}/follow`);
      } else {
        await axios.post(`${API_URL}/profile/${user.username}/follow`);
      }
      onFollowToggle(user.id);
    } catch (err) { console.error(err); }
    finally { setPending(false); }
  };

  return (
    <div
      className="userResultCard"
      onClick={() => navigate(`/Profile/${user.username}`)}
    >
      <UserAvatar avatar_url={user.avatar_url} size={40} />
      <div className="userResultInfo">
        <strong>{user.name}</strong>
        <span>@{user.username}</span>
        {user.bio && <p className="userResultBio">{user.bio}</p>}
        <span className="userResultFollowers">
          {user.followers_count} followers
        </span>
      </div>
      <button
        className={`searchFollowBtn ${user.is_following ? "following" : ""}`}
        onClick={handleFollow}
        disabled={pending}
      >
        {user.is_following ? "Unfollow" : "Follow"}
      </button>
    </div>
  );
}

// ── SearchDropdown ────────────────────────────────────────────────────────────
function SearchDropdown({ results, query, onSelect, onClose }) {
  const navigate = useNavigate();
  const { users, vendors, posts, trending, hashtags } = results
 const hasResults = users?.length || vendors?.length || posts?.length || trending?.length || hashtags?.length;

  if (!hasResults) return (
    <div className="searchDropdown">
      <p className="dropdownEmpty">No results for "<strong>{query}</strong>"</p>
    </div>
  );

  return (
    <div className="searchDropdown">
        {users?.length > 0 && (
        <div className="dropdownSection">
          <p className="dropdownLabel"><AccountCircleIcon sx={{ fontSize: 14 }} /> People</p>
          {users.map((u) => (
            <div key={u.id} className="dropdownItem"
              onClick={() => { navigate(`/Profile/${u.username}`); onClose(); }}>
              <UserAvatar avatar_url={u.avatar_url} size={32} />
              <div className="dropdownItemText">
                <strong>{u.name}</strong>
                <span>@{u.username}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {vendors?.length > 0 && (
        <div className="dropdownSection">
          <p className="dropdownLabel"><i className="ti ti-building-store" style={{ fontSize: 14 }} /> Businesses</p>
          {vendors.map((v) => (
            <div key={v.id} className="dropdownItem"
              onClick={() => {
                const slug = v.business_name.toLowerCase().replace(/ /g, "-")
                navigate(`/shop/${slug}`)
                onClose()
              }}>
              <UserAvatar avatar_url={v.avatar_url} size={32} variant="vendor" />
              <div className="dropdownItemText">
                <strong>{v.business_name}</strong>
                <span>{v.business_category}</span>
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
            <div
              key={i}
              className="dropdownItem"
              onClick={() => {
                onSelect(h.tag);
                onClose();
              }}
            >
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
    <p className="dropdownLabel"><WhatshotIcon sx={{ fontSize: 14 }} /> Trending</p>
    {trending.map((t) => (
      <div key={t.id} className="dropdownItem"
        onClick={() => { onSelect(t.post_text); onClose(); }}>
        {/* <WhatshotIcon sx={{ fontSize: 28, color: "#ff6b35" }} /> */}
        <div className="dropdownItemText">
          <strong>{t.post_text?.slice(0, 50)}{t.post_text?.length > 50 ? "..." : ""}</strong>
          <span>{t.business_name}  {t.likes_count}</span>
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
            <div
              key={p.id}
              className="dropdownItem"
              onClick={() => {
                onSelect(p.post_text);
                onClose();
              }}
            >
              {/* <ArticleOutlinedIcon
                sx={{ fontSize: 28, color: "var(--border)" }}
              /> */}
              <div className="dropdownItemText">
                <strong>
                  {p.post_text?.slice(0, 50)}
                  {p.post_text?.length > 50 ? "..." : ""}
                </strong>
                {/* <span>@{p.username}</span> */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Search ───────────────────────────────────────────────────────────────
function Search() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdown, setDropdown] = useState({});
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [trending, setTrending] = useState([]);
  const [products, setProducts] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(true);

  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // ── discover + cache ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDiscover = async () => {
      // 1. show cache instantly
      const cached = getDiscoverCache();
      if (cached) {
        setVideos(cached.videos);
        setTrending(cached.trending);
        setProducts(cached.products);
        setDiscoverLoading(false);
      }
   try{
        const [discoverRes, productsRes, trendingRes] = await Promise.all([
          axios.get(`${API_URL}/search/discover`),
          axios.get(`${API_URL}/products`),
          axios.get(`${API_URL}/posts/trending`),
        ]);

        const flat = Object.values(productsRes.data.products)
          .flat()
          .sort(() => Math.random() - 0.5);
        const freshTrending = trendingRes.data.trending_posts;

        setVideos(discoverRes.data.videos);
        setTrending(freshTrending);
        setProducts(flat);

        setDiscoverCache({
          videos: discoverRes.data.videos,
          trending: freshTrending,
          products: flat,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setDiscoverLoading(false);
      }
    };
    fetchDiscover();
  }, []);

  // ── debounced autocomplete ─────────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim()) {
      setShowDropdown(false);
      setDropdown({});
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(
          `${API_URL}/search/autocomplete?q=${encodeURIComponent(query)}`

        );
        setDropdown(res.data.results);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // ── close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── full search ────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!user) return navigate("/auth");
    if (!query.trim()) return;
    setShowDropdown(false);
    setSearching(true);
    try {
      const res = await axios.get(
        `${API_URL}/search?q=${encodeURIComponent(query)}`,
      );
      setUsers(res.data.users);
      setPosts(res.data.posts);
      setVideos(res.data.videos);
      setTrending(res.data.trending);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleFollowToggle = (userId) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              is_following: !u.is_following,
              followers_count: u.is_following
                ? u.followers_count - 1
                : u.followers_count + 1,
            }
          : u,
      ),
    );
  };

  const handleLikeToggle = async (post) => {
    if (!user) return navigate("/auth");
    const liked = post.liked_by_me;
    try {

      liked
        ? await axios.delete(`${API_URL}/posts/${post.id}/like`)
        : await axios.post(`${API_URL}/posts/${post.id}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                liked_by_me: !liked,
                likes_count: liked ? p.likes_count - 1 : p.likes_count + 1,
              }
            : p,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleRepostToggle = async (post) => {
    const reposted = post.reposted_by_me;
    try {
      reposted
        ? await axios.delete(`${API_URL}/posts/${post.id}/repost`)
        : await axios.post(
            `${API_URL}/posts/${post.id}/repost`,
          );
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                reposted_by_me: !reposted,
                reposts_count: reposted
                  ? p.reposts_count - 1
                  : p.reposts_count + 1,
              }
            : p,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmarkToggle = async (post) => {
    const bookmarked = post.bookmarked_by_me;
    try {
      bookmarked
        ? await axios.delete(`${API_URL}/posts/${post.id}/bookmark`)
        : await axios.post(
            `${API_URL}/posts/${post.id}/bookmark`
          );
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                bookmarked_by_me: !bookmarked,
                bookmarks_count: bookmarked
                  ? p.bookmarks_count - 1
                  : p.bookmarks_count + 1,
              }
            : p,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="searchGridContainer">
      {/* ── Search Bar ── */}
      <div className="InputContainer">
        <div className="search-wrapper" ref={wrapperRef}>
          <div className="search-bar-row">
            <input
              type="text"
              placeholder="Search people, posts, hashtags..."
              className="main-input"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHasSearched(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => query.trim() && setShowDropdown(true)}
              autoComplete="off"
            />
            {query && (
              <button
                className="clear-btn"
                onClick={() => {
                  setQuery("");
                  setShowDropdown(false);
                  setHasSearched(false);
                }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </button>
            )}
            <button
              className="search-go"
              onClick={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <span style={{ fontSize: 12 }}>...</span>
              ) : (
                <SearchSharpIcon sx={{ fontSize: 24 }} />
              )}
            </button>
          </div>

          {showDropdown && (
            <SearchDropdown
              results={dropdown}
              query={query}
              onSelect={(text) => {
                setQuery(text);
                handleSearch();
              }}
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
  <UserCard key={u.id} user={u} onFollowToggle={handleFollowToggle} />
))}
            </div>
          )}
          {posts.length > 0 && (
            <div className="resultSection">
              <h3 className="resultHeading">Posts</h3>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLikeToggle={handleLikeToggle}
                  onRepostToggle={handleRepostToggle}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              ))}
            </div>
          )}
          {users.length === 0 && posts.length === 0 && (
            <p
              style={{
                color: "var(--text-secondary)",
                textAlign: "center",
                padding: "2rem",
                gridColumn: "span 3",
              }}
            >
              No results for "<strong>{query}</strong>"
            </p>
          )}
        </div>
      )}

      {/* ── Default Discover (skeletons until data arrives) ── */}
      {!hasSearched && (
        <>
          <LuckyPick products={products} loading={discoverLoading} />
          <VideosGrid videos={videos} loading={discoverLoading} />
          <Trending items={trending} loading={discoverLoading} />
        </>
      )}
    </div>
  );
}

export default Search;
