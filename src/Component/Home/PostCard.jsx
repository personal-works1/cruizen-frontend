import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import EqualizerOutlinedIcon from "@mui/icons-material/EqualizerOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import SendIcon from "@mui/icons-material/Send";
import WinnerBadge from "../Leaderboard/WinnerBadge";
import CommentModal from "./Comment/commentModel";
import { useNavigate } from "react-router-dom";
import UserAvatar from "../Common/UserAvatar";
import { useAuth } from "../Context/AuthContext";
import { API_URL } from "../Authentication/Authentication";

export default function PostCard({ post, onLikeToggle, onRepostToggle, onBookmarkToggle, autoOpenComments = false }) {
  const { user, getValidToken } = useAuth()
  const navigate = useNavigate()

  // ── guard against null post or user not loaded yet ───────────────────
  if (!post || !post.id) return null

  const isLiked      = post.liked_by_me
  const isReposted   = post.reposted_by_me
  const isBookmarked = post.bookmarked_by_me

  const [showCommentModal, setShowCommentModal] = useState(false)
  const [viewCounted,      setViewCounted]      = useState(false) // ← prevent double counting
  const cardRef = useRef(null) // ← ref to detect when card enters viewport
  const [badges, setBadges] = useState([])
  const [localCommentsCount, setLocalCommentsCount] = useState(post.comments_count || 0)

  const profileUsername = post.real_username || post.username

  // ── auto open comments if navigated from comment notification ────────
  useEffect(() => {
    if (autoOpenComments) setShowCommentModal(true)
  }, [autoOpenComments])
useEffect(() => {
  const fetchBadges = async () => {
    try {
      const token = await getValidToken()
      const res = await axios.get(`${API_URL}/leaderboard/badges/${post.user_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBadges(res.data.badges)
    } catch {}
  }
  if (post.user_id) fetchBadges()
}, [post.user_id])
useEffect(() => {
  setLocalCommentsCount(post.comments_count || 0)
}, [post.comments_count])

  // ── silently record view when post enters viewport ───────────────────
  // uses IntersectionObserver — fires when 60% of post is visible
  // only counts once per render (viewCounted flag prevents duplicates)
  const recordView = useCallback(async () => {
    if (viewCounted) return // ← already counted this render
    if (!user) return       // ← not logged in, skip
    try {
      const token = await getValidToken()
      await axios.post(
        `${API_URL}/posts/${post.id}/view`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setViewCounted(true) // ← mark as counted so it doesn't fire again
    } catch (err) {
      // ── silent fail — views are not critical, don't disturb UX ──────
      console.error("View record failed silently:", err)
    }
  }, [post.id, user, viewCounted])

  useEffect(() => {
    // ── create observer — watches when post enters viewport ───────────
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // ── fires when 60% of the post card is visible ───────────────
          if (entry.isIntersecting && !viewCounted) {
            recordView()
          }
        })
      },
      { threshold: 0.6 } // ← 60% of card must be visible to count
    )

    // ── attach observer to the post card element ──────────────────────
    if (cardRef.current) observer.observe(cardRef.current)

    // ── cleanup: disconnect observer when component unmounts ──────────
    return () => observer.disconnect()
  }, [recordView, viewCounted])
    // ── attach ref so IntersectionObserver can watch this element ──────
    return (
    <div className="userPostFeed" ref={cardRef}>
      <div className="profileNview">
        <div>
          <UserAvatar
  avatar_url={post.avatar_url}
  size={40}
  style={{ cursor: "pointer" }}
 onClick={() => {
  if (post.author_type === "business") {
    navigate(`/shop/${post.vendor_id}`)
  } else {
    navigate(`/profile/${post.real_username}`)
  }
}}
/>
          <p
            className="pUsername"
            style={{ cursor: "pointer", color: "var(--text-primary)" }}  // ← added color
            onClick={() => {
  if (post.author_type === "business") {
    navigate(`/shop/${post.vendor_id}`)
  } else {
    navigate(`/profile/${post.real_username}`)
  }
}}
          >
            {post.name || post.username}
            {post.author_type === "business" && (
              <span style={{
                fontSize: "10px",
                background: "var(--accent-light)",   // ← was #f5e6ff
                color: "var(--accent)",               // ← was #61027b
                borderRadius: "4px",
                padding: "1px 5px",
                marginLeft: "6px",
                fontWeight: 600,
              }}>
                🏪 Business
              </span>
            )}
          </p>
          <WinnerBadge badges={badges} size="small" />
        </div>
        <div>
          {/* MUI sx doesn't read CSS vars reliably — use style instead */}
          <EqualizerOutlinedIcon style={{ color: "var(--accent)" }} />  {/* ← was sx */}
          <p className="pUsername" style={{ color: "var(--text-primary)" }}> {/* ← added */}
            {post.views_count || 0}
          </p>
        </div>
      </div>

      <div className="postFeedActivity">
        {/* ← "username: caption" fix — just show post_text */}
        <p style={{ color: "var(--text-primary)" }}>{post.post_text}</p>

        {/* media stays the same */}
        {post.media_url && post.media_type === "image" && (
          <div className="ImgOrVideo">
            <img src={post.media_url} alt="post"
              onError={(e) => { e.target.parentElement.style.display = "none" }} />
          </div>
        )}
        {post.media_url && post.media_type === "video" && (
          <div className="ImgOrVideo">
            <video src={post.media_url} controls />
          </div>
        )}

        <div className="engagementContainer">
          <div className="S">
            <div onClick={() => onLikeToggle(post)} style={{ cursor: "pointer" }}>
              {isLiked
                ? <FavoriteIcon sx={{ color: "red" }} />
                : <FavoriteBorderIcon style={{ color: "var(--text-primary)" }} />}
              <p style={{ color: "var(--text-primary)" }}>{post.likes_count || 0}</p>
            </div>
            <div onClick={() => setShowCommentModal(true)} style={{ cursor: "pointer" }}>
              <CommentOutlinedIcon style={{ color: "var(--text-primary)" }} />
              <p style={{ color: "var(--text-primary)" }}>{localCommentsCount}</p>
            </div>
            <div onClick={() => onRepostToggle(post)} style={{ cursor: "pointer" }}>
              <RepeatOutlinedIcon style={{ color: isReposted ? "#17bf63" : "var(--text-primary)" }} />
              <p style={{ color: isReposted ? "#17bf63" : "var(--text-primary)" }}>
                {post.reposts_count || 0}
              </p>
            </div>
            <div onClick={() => onBookmarkToggle(post)} style={{ cursor: "pointer" }}>
              {isBookmarked
                ? <BookmarkIcon style={{ color: "var(--accent)" }} />       // ← was sx #9c01c6
                : <BookmarkBorderOutlinedIcon style={{ color: "var(--text-primary)" }} />}
              <p style={{ color: "var(--text-primary)" }}>{post.bookmarks_count || 0}</p>
            </div>
          </div>
          <div className="O">
            <SendIcon style={{ color: "var(--text-primary)" }} />
            <p style={{ color: "var(--text-primary)" }}>0</p>
          </div>
        </div>
      </div>

      {showCommentModal && (
  <CommentModal 
    post={post} 
    onClose={() => setShowCommentModal(false)}
    onCommentAdded={() => setLocalCommentsCount(prev => prev + 1)}
  />
)}
    </div>
  )
}