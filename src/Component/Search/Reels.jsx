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
function ReelItem({ video, index, isActive, muted, onMuteToggle, onLike, onRepost, onBookmark, onFollow }) {
  const videoRef = useRef(null)
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const [paused, setPaused] = useState(false)

const handleVideoTap = () => {
  if (!videoRef.current) return
  if (videoRef.current.paused) {
    videoRef.current.play()
    setPaused(false)
  } else {
    videoRef.current.pause()
    setPaused(true)
  }
}

  useEffect(() => {
    if (!videoRef.current) return
    if (isActive) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [isActive])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted
    }
  }, [muted])

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
        {/* mobile overlay user info */}
<div className="reelUserInfo"
  onClick={() => navigate(`/profile/${video.username}`)}>
  <UserAvatar avatar_url={video.avatar_url} size={36} />
  <div>
    <p className="reelUsername">@{video.username}</p>
    {video.post_text && (
      <p className="reelCaption">
        {video.post_text?.slice(0, 60)}
        {video.post_text?.length > 60 ? "..." : ""}
      </p>
    )}
    {video.user_id !== me?.id && !video.is_following && (
      <button className="reelFollowBtn" onClick={(e) => {
        e.stopPropagation()
        onFollow(video)
      }}>Follow</button>
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
        <button className="reelActionBtn"
          onClick={() => navigate(`/post/${video.id}?comments=open`)}>
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
  <div className="reelDesktopUser"
    onClick={() => navigate(`/profile/${video.username}`)}>
    <UserAvatar avatar_url={video.avatar_url} size={44} />
    <div>
      <p className="reelUsername">@{video.username}</p>
      {video.post_text && (
        <p className="reelCaption">
          {video.post_text?.slice(0, 60)}
          {video.post_text?.length > 60 ? "..." : ""}
        </p>
      )}
      {video.user_id !== me?.id && !video.is_following && (
        <button className="reelFollowBtn" onClick={(e) => {
          e.stopPropagation()
          onFollow(video)
        }}>Follow</button>
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
  <button className="reelActionBtn"
    onClick={() => navigate(`/post/${video.id}?comments=open`)}>
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
  const { postId }              = useParams()
  const navigate                = useNavigate()
  const { getValidToken }       = useAuth()

  const [videos,      setVideos]      = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [muted,       setMuted]       = useState(false)
  const [loading,     setLoading]     = useState(true)

  const containerRef = useRef(null)
  const observerRef  = useRef(null)

  // ── fetch videos ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
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
    fetch()
  }, [postId])

  // ── intersection observer — detect which reel is active ──────────────
  useEffect(() => {
    if (!videos.length) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index)
            setActiveIndex(index)
          }
        })
      },
      { threshold: 0.7 }
    )

    const items = containerRef.current?.querySelectorAll(".reelItem")
    items?.forEach((item) => observerRef.current.observe(item))

    return () => observerRef.current?.disconnect()
  }, [videos])

  // ── like ──────────────────────────────────────────────────────────────
  const handleLike = async (video) => {
    const liked = video.liked_by_me
    try {
      const token = await getValidToken()
      const headers = { Authorization: `Bearer ${token}` }
      liked
        ? await axios.delete(`${API_URL}/posts/${video.id}/like`, { headers })
        : await axios.post(`${API_URL}/posts/${video.id}/like`, {}, { headers })
      setVideos((prev) => prev.map((v) =>
        v.id === video.id
          ? { ...v, liked_by_me: !liked, likes_count: liked ? v.likes_count - 1 : v.likes_count + 1 }
          : v
      ))
    } catch (err) { console.error(err) }
  }

  // ── repost ────────────────────────────────────────────────────────────
  const handleRepost = async (video) => {
    const reposted = video.reposted_by_me
    try {
      const token = await getValidToken()
      const headers = { Authorization: `Bearer ${token}` }
      reposted
        ? await axios.delete(`${API_URL}/posts/${video.id}/repost`, { headers })
        : await axios.post(`${API_URL}/posts/${video.id}/repost`, {}, { headers })
      setVideos((prev) => prev.map((v) =>
        v.id === video.id
          ? { ...v, reposted_by_me: !reposted, reposts_count: reposted ? v.reposts_count - 1 : v.reposts_count + 1 }
          : v
      ))
    } catch (err) { console.error(err) }
  }

  // ── bookmark ──────────────────────────────────────────────────────────
  const handleBookmark = async (video) => {
    const bookmarked = video.bookmarked_by_me
    try {
      const token = await getValidToken()
      const headers = { Authorization: `Bearer ${token}` }
      bookmarked
        ? await axios.delete(`${API_URL}/posts/${video.id}/bookmark`, { headers })
        : await axios.post(`${API_URL}/posts/${video.id}/bookmark`, {}, { headers })
      setVideos((prev) => prev.map((v) =>
        v.id === video.id
          ? { ...v, bookmarked_by_me: !bookmarked, bookmarks_count: bookmarked ? v.bookmarks_count - 1 : v.bookmarks_count + 1 }
          : v
      ))
    } catch (err) { console.error(err) }
  }

  // ── follow ────────────────────────────────────────────────────────────
  const handleFollow = async (video) => {
    try {
      const token = await getValidToken()
      await axios.post(
        `${API_URL}/profile/${video.username}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setVideos((prev) => prev.map((v) =>
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
      {/* ── back button ── */}
      <button className="reelsBackBtn" onClick={() => navigate(-1)}>
        <ArrowBackIcon sx={{ fontSize: 24 }} />
      </button>

      {/* ── mute indicator ── */}
      <div className="reelsMuteHint" onClick={() => setMuted(m => !m)}>
        {muted ? <VolumeOffIcon sx={{ fontSize: 20 }} /> : <VolumeUpIcon sx={{ fontSize: 20 }} />}
      </div>

      {/* ── reels container ── */}
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
  )
}

export default Reels
