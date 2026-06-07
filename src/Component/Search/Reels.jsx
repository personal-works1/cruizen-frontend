import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import FavoriteIcon from "@mui/icons-material/Favorite"
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder"
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline"
import RepeatIcon from "@mui/icons-material/Repeat"
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder"
import BookmarkIcon from "@mui/icons-material/Bookmark"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import VolumeOffIcon from "@mui/icons-material/VolumeOff"
import VolumeUpIcon from "@mui/icons-material/VolumeUp"
import UserAvatar from "../Common/UserAvatar"
import { useAuth } from "../Context/AuthContext"
import { API_URL } from "../Authentication/Authentication"
import "./Reels.css"

// ── Single Reel ───────────────────────────────────────────────────────────────
// Bug #1 + #3 fix: isActive drives play/pause; IntersectionObserver in the
// parent sets activeIndex, so only the visible reel ever plays.
function ReelItem({ video, index, isActive, muted, onMuteToggle, onLike, onRepost, onBookmark, onFollow }) {
  const videoRef = useRef(null)
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const [paused, setPaused] = useState(false)

  // ── Bug #1 + #3: play/pause entirely driven by isActive ─────────────────
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    if (isActive) {
      // reset manual-pause state when reel becomes active
      setPaused(false)
      vid.play().catch(() => {})
    } else {
      // Bug #3: pause + reset any reel that scrolls out of view
      vid.pause()
      vid.currentTime = 0
    }
  }, [isActive])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  const handleVideoTap = () => {
    const vid = videoRef.current
    if (!vid) return
    // only allow manual pause/resume on the active reel
    if (!isActive) return
    if (vid.paused) {
      vid.play().catch(() => {})
      setPaused(false)
    } else {
      vid.pause()
      setPaused(true)
    }
  }

  return (
    <div className="reelItem" data-index={index}>
      <video
        ref={videoRef}
        src={video.media_url}
        loop
        playsInline
        muted={muted}
        onClick={handleVideoTap}
        className="reelVideo"
      />

      {paused && (
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.5)",
          borderRadius: "50%",
          width: 64, height: 64,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none", zIndex: 20
        }}>
          <span style={{ color: "#fff", fontSize: 28 }}>▐▐</span>
        </div>
      )}

      {/* ── MOBILE ONLY: everything floats on video ── */}
      <div className="reelMobileOverlay">
        <div className="reelOverlay">
          <div className="reelUserInfo" onClick={() => navigate(`/profile/${video.username}`)}>
            <UserAvatar avatar_url={video.avatar_url} size={36} />
            <div>
              <p className="reelUsername">@{video.username}</p>
              {video.post_text && (
                <p className="reelCaption">
                  {video.post_text?.slice(0, 60)}{video.post_text?.length > 60 ? "..." : ""}
                </p>
              )}
              {video.user_id !== me?.id && !video.is_following && (
                <button className="reelFollowBtn" onClick={(e) => { e.stopPropagation(); onFollow(video) }}>
                  Follow
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="reelActions">
          <button className="reelActionBtn" onClick={onMuteToggle}>
            {muted ? <VolumeOffIcon sx={{ fontSize: 26 }} /> : <VolumeUpIcon sx={{ fontSize: 26 }} />}
          </button>
          <button className="reelActionBtn" onClick={() => onLike(video)}>
            {video.liked_by_me
              ? <FavoriteIcon sx={{ fontSize: 28, color: "#ff4b4b" }} />
              : <FavoriteBorderIcon sx={{ fontSize: 28, color: "#fff" }} />}
            <span className="reelActionCount">{video.likes_count}</span>
          </button>
          <button className="reelActionBtn" onClick={() => navigate(`/post/${video.id}?comments=open`)}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 26, color: "#fff" }} />
            <span className="reelActionCount">{video.comments_count}</span>
          </button>
          <button className="reelActionBtn" onClick={() => onRepost(video)}>
            <RepeatIcon sx={{ fontSize: 26, color: video.reposted_by_me ? "#17bf63" : "#fff" }} />
            <span className="reelActionCount">{video.reposts_count}</span>
          </button>
          <button className="reelActionBtn" onClick={() => onBookmark(video)}>
            {video.bookmarked_by_me
              ? <BookmarkIcon sx={{ fontSize: 26, color: "#61027b" }} />
              : <BookmarkBorderIcon sx={{ fontSize: 26, color: "#fff" }} />}
          </button>
        </div>
      </div>

      {/* ── DESKTOP ONLY ── */}
      <div className="reelDesktopLeft">
        <div className="reelDesktopUser" onClick={() => navigate(`/profile/${video.username}`)}>
          <UserAvatar avatar_url={video.avatar_url} size={44} />
          <div>
            <p className="reelUsername">@{video.username}</p>
            {video.post_text && (
              <p className="reelCaption">
                {video.post_text?.slice(0, 60)}{video.post_text?.length > 60 ? "..." : ""}
              </p>
            )}
            {video.user_id !== me?.id && !video.is_following && (
              <button className="reelFollowBtn" onClick={(e) => { e.stopPropagation(); onFollow(video) }}>
                Follow
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="reelDesktopRight">
        <button className="reelActionBtn" onClick={onMuteToggle}>
          {muted ? <VolumeOffIcon sx={{ fontSize: 26, color: "#fff" }} /> : <VolumeUpIcon sx={{ fontSize: 26, color: "#fff" }} />}
        </button>
        <button className="reelActionBtn" onClick={() => onLike(video)}>
          {video.liked_by_me
            ? <FavoriteIcon sx={{ fontSize: 28, color: "#ff4b4b" }} />
            : <FavoriteBorderIcon sx={{ fontSize: 28, color: "#fff" }} />}
          <span className="reelActionCount">{video.likes_count}</span>
        </button>
        <button className="reelActionBtn" onClick={() => navigate(`/post/${video.id}?comments=open`)}>
          <ChatBubbleOutlineIcon sx={{ fontSize: 26, color: "#fff" }} />
          <span className="reelActionCount">{video.comments_count}</span>
        </button>
        <button className="reelActionBtn" onClick={() => onRepost(video)}>
          <RepeatIcon sx={{ fontSize: 26, color: video.reposted_by_me ? "#17bf63" : "#fff" }} />
          <span className="reelActionCount">{video.reposts_count}</span>
        </button>
        <button className="reelActionBtn" onClick={() => onBookmark(video)}>
          {video.bookmarked_by_me
            ? <BookmarkIcon sx={{ fontSize: 26, color: "#61027b" }} />
            : <BookmarkBorderIcon sx={{ fontSize: 26, color: "#fff" }} />}
        </button>
      </div>
    </div>
  )
}

// ── Reels Page ────────────────────────────────────────────────────────────────
function Reels() {
  const { postId }        = useParams()
  const navigate          = useNavigate()
  const { getValidToken } = useAuth()

  const [videos,      setVideos]      = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [muted,       setMuted]       = useState(false)
  const [loading,     setLoading]     = useState(true)

  // Bug #1 + #3 fix: observer must be rooted to the scrolling container,
  // not the document — otherwise threshold calculations are wrong and
  // multiple reels can appear "intersecting" at once.
  const containerRef = useRef(null)
  const observerRef  = useRef(null)

  // ── fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getValidToken()
        const res = await axios.get(
          `${API_URL}/search/reels/${postId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setVideos(res.data.videos)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [postId])

  // ── IntersectionObserver — rooted to the scroll container ────────────────
  // Bug #1: threshold 0.7 means a reel must be 70 % visible before it's
  // considered "active". Only one reel can be 70 % visible at a time in a
  // full-viewport snap scroller, so this naturally enforces one-video-at-a-time.
  // Bug #3: when a reel drops below 70 % (scroll away), isActive becomes false
  // in ReelItem and the useEffect pauses + resets it immediately.
  useEffect(() => {
    if (!videos.length || !containerRef.current) return

    observerRef.current?.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveIndex(Number(entry.target.dataset.index))
          }
        })
      },
      {
        root: containerRef.current, // ← scoped to the scroll container
        threshold: 0.7,
      }
    )

    const items = containerRef.current.querySelectorAll(".reelItem")
    items.forEach((item) => observerRef.current.observe(item))

    return () => observerRef.current?.disconnect()
  }, [videos])

  // ── engagement handlers ───────────────────────────────────────────────────
  const handleLike = async (video) => {
    const liked = video.liked_by_me
    try {
      const token = await getValidToken()
      const headers = { Authorization: `Bearer ${token}` }
      liked
        ? await axios.delete(`${API_URL}/posts/${video.id}/like`, { headers })
        : await axios.post(`${API_URL}/posts/${video.id}/like`, {}, { headers })
      setVideos(prev => prev.map(v =>
        v.id === video.id
          ? { ...v, liked_by_me: !liked, likes_count: liked ? v.likes_count - 1 : v.likes_count + 1 }
          : v
      ))
    } catch (err) { console.error(err) }
  }

  const handleRepost = async (video) => {
    const reposted = video.reposted_by_me
    try {
      const token = await getValidToken()
      const headers = { Authorization: `Bearer ${token}` }
      reposted
        ? await axios.delete(`${API_URL}/posts/${video.id}/repost`, { headers })
        : await axios.post(`${API_URL}/posts/${video.id}/repost`, {}, { headers })
      setVideos(prev => prev.map(v =>
        v.id === video.id
          ? { ...v, reposted_by_me: !reposted, reposts_count: reposted ? v.reposts_count - 1 : v.reposts_count + 1 }
          : v
      ))
    } catch (err) { console.error(err) }
  }

  const handleBookmark = async (video) => {
    const bookmarked = video.bookmarked_by_me
    try {
      const token = await getValidToken()
      const headers = { Authorization: `Bearer ${token}` }
      bookmarked
        ? await axios.delete(`${API_URL}/posts/${video.id}/bookmark`, { headers })
        : await axios.post(`${API_URL}/posts/${video.id}/bookmark`, {}, { headers })
      setVideos(prev => prev.map(v =>
        v.id === video.id
          ? { ...v, bookmarked_by_me: !bookmarked, bookmarks_count: bookmarked ? v.bookmarks_count - 1 : v.bookmarks_count + 1 }
          : v
      ))
    } catch (err) { console.error(err) }
  }

  const handleFollow = async (video) => {
    try {
      const token = await getValidToken()
      await axios.post(
        `${API_URL}/profile/${video.username}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setVideos(prev => prev.map(v =>
        v.user_id === video.user_id ? { ...v, is_following: true } : v
      ))
    } catch (err) { console.error(err) }
  }

  if (loading) return (
    <div style={{
      height: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "#000", color: "#fff"
    }}>
      Loading...
    </div>
  )

  return (
    <div className="reelsPage">
      <button className="reelsBackBtn" onClick={() => navigate(-1)}>
        <ArrowBackIcon sx={{ fontSize: 24 }} />
      </button>

      <div className="reelsMuteHint" onClick={() => setMuted(m => !m)}>
        {muted ? <VolumeOffIcon sx={{ fontSize: 20 }} /> : <VolumeUpIcon sx={{ fontSize: 20 }} />}
      </div>

      {/* Bug #1 + #3 fix: the scroll container needs ref so the observer
          can use it as its root. The reelsPage CSS already handles overflow. */}
      <div className="reelsContainer" ref={containerRef}>
        {videos.map((video, index) => (
          <ReelItem
            key={video.id}
            index={index}
            video={video}
            isActive={index === activeIndex}
            muted={muted}
            onMuteToggle={() => setMuted(m => !m)}
            onLike={handleLike}
            onRepost={handleRepost}
            onBookmark={handleBookmark}
            onFollow={handleFollow}
          />
        ))}
      </div>
    </div>
  )
}

export default Reels
