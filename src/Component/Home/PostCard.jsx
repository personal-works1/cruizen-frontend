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
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import CloseIcon from "@mui/icons-material/Close";
import WinnerBadge from "../Leaderboard/WinnerBadge";
import CommentModal from "./Comment/commentModel";
import { useNavigate } from "react-router-dom";
import UserAvatar from "../Common/UserAvatar";
import { useAuth } from "../Context/AuthContext";
import { API_URL } from "../Authentication/Authentication";

// ── Global single-video manager (Bug #1) ─────────────────────────────────────
const videoManager = {
  current: null,
  play(videoEl) {
    if (this.current && this.current !== videoEl) {
      this.current.pause();
    }
    this.current = videoEl;
  },
  clear(videoEl) {
    if (this.current === videoEl) this.current = null;
  },
};

// ── ImageLightbox ─────────────────────────────────────────────────────────────
function ImageLightbox({ src, onClose }) {
  // close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        cursor: "zoom-out",
      }}
    >
      {/* close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "rgba(255,255,255,0.15)",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          backdropFilter: "blur(4px)",
        }}
      >
        <CloseIcon sx={{ fontSize: 22 }} />
      </button>

      {/* image — stopPropagation so clicking the image itself doesn't close */}
      <img
        src={src}
        alt="full size"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "100%",
          maxHeight: "90vh",
          objectFit: "contain",
          borderRadius: "8px",
          cursor: "default",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        }}
      />
    </div>
  );
}

// ── VideoThumb ────────────────────────────────────────────────────────────────
function VideoThumb({ src, postId }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoManager.play(vid);
          vid.play().catch(() => {});
        } else {
          vid.pause();
          videoManager.clear(vid);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(vid);
    return () => { observer.disconnect(); videoManager.clear(vid); };
  }, []);

  const handleMuteToggle = (e) => {
    e.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setMuted(vid.muted);
  };
  const thumbnail = src?.replace(/\.(mp4|mov|webm)$/i, ".jpg")

  return (
    <div
      className="ImgOrVideo"
      style={{ position: "relative", cursor: "pointer" }}
      onClick={() => navigate(`/reels/${postId}`)}
    >
     <video
  ref={videoRef}
  src={src}
  loop
  playsInline
  muted={muted}
  poster={thumbnail}
  style={{ width: "100%", borderRadius: "8px", display: "block", pointerEvents: "none" }}
/>
      <button
        onClick={handleMuteToggle}
        style={{
          position: "absolute",
          bottom: 8, right: 8,
          background: "rgba(0,0,0,0.55)",
          border: "none", borderRadius: "50%",
          width: 34, height: 34,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#fff",
          backdropFilter: "blur(4px)", zIndex: 2,
        }}
      >
        {muted ? <VolumeOffIcon sx={{ fontSize: 17 }} /> : <VolumeUpIcon sx={{ fontSize: 17 }} />}
      </button>
    </div>
  );
}

// ── PostCard ──────────────────────────────────────────────────────────────────
export default function PostCard({
  post,
  onLikeToggle,
  onRepostToggle,
  onBookmarkToggle,
  onDelete,
  autoOpenComments = false,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!post || !post.id) return null;

  const isLiked      = post.liked_by_me;
  const isReposted   = post.reposted_by_me;
  const isBookmarked = post.bookmarked_by_me;

  const [showCommentModal,   setShowCommentModal]   = useState(false);
  const [lightboxSrc,        setLightboxSrc]        = useState(null);
  const [viewCounted,        setViewCounted]        = useState(false);
  const [badges,             setBadges]             = useState([]);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.comments_count || 0);
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null)

  const cardRef = useRef(null);

  useEffect(() => {
    if (autoOpenComments) setShowCommentModal(true);
  }, [autoOpenComments]);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await axios.get(`${API_URL}/leaderboard/badges/${post.user_id}`);
        setBadges(res.data.badges);
      } catch {}
    };
    if (post.user_id) fetchBadges();
  }, [post.user_id]);

  useEffect(() => {
    setLocalCommentsCount(post.comments_count || 0);
  }, [post.comments_count]);
  
  useEffect(() => {
  const handler = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setMenuOpen(false)
    }
  }
  document.addEventListener("mousedown", handler)
  return () => document.removeEventListener("mousedown", handler)
}, [])

  const recordView = useCallback(async () => {
    if (viewCounted || !user) return;
    try {
      await axios.post(
        `${API_URL}/posts/${post.id}/view`,
        {},
      );
      setViewCounted(true);
    } catch (err) {
      console.error("View record failed silently:", err);
    }
  }, [post.id, user, viewCounted]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !viewCounted) recordView();
        });
      },
      { threshold: 0.6 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [recordView, viewCounted]);

   const handleDelete = async ()=> {
       if (!window.confirm("Delete this post?")) return;
                  try {
                    await axios.delete(`${API_URL}/posts/${post.id}`);
                    onDelete?.(post.id);
                  } 
                  catch (err) {
                    console.error(err); }
   }
  const goToProfile = () => {
  if (post.author_type === "business") {
    const slug = post.business_name?.toLowerCase().replace(/ /g, "-");
    if (slug) navigate(`/shop/${slug}`);
  } else {
    navigate(`/profile/${post.username}`);
  }
};


const displayAvatar = post.author_type === "business"
  ? (post.vendor_avatar_url || post.display_avatar || null)
  : post.avatar_url

const displayName = post.author_type === "business"
  ? post.business_name
  : (post.name || post.username)

const displayUsername = post.author_type === "business"
  ? post.business_name
  : post.username

  return (
    <div className="userPostFeed" ref={cardRef}>
      <div className="profileNview">
        <div>
          <UserAvatar
           avatar_url={displayAvatar}
  size={40} 
            style={{ cursor: "pointer" }}
            onClick={goToProfile}
          />
          <p
            className="pUsername"
            style={{ cursor: "pointer", color: "var(--text-primary)" }}
            onClick={goToProfile}
          >
         {displayName}
            {post.author_type === "business" && (
              <span style={{
                fontSize: "10px",
                background: "var(--accent-light)",
                color: "var(--accent)",
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
         <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  {/* <EqualizerOutlinedIcon style={{ color: "var(--accent)" }} />
  <p className="pUsername" style={{ color: "var(--text-primary)" }}>
    {post.views_count || 0}
  </p> */}

  {/* 3-dot menu — owner only */}
  {user && user.id === post.user_id && (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={() => setMenuOpen(o => !o)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 18, color: "var(--text-secondary)",
          padding: "4px 6px", lineHeight: 1, borderRadius: 6,
        }}
      >
        ⋮
      </button>
      {menuOpen && (
        <div style={{
          position: "absolute", right: 0, top: "110%", zIndex: 9999,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
          minWidth: 150, overflow: "hidden",
        }}>
          <button
            onClick={() => { setMenuOpen(false); handleDelete(); }}
            disabled={deleting}
            style={{
              width: "100%", padding: "10px 16px", textAlign: "left",
              background: "none", border: "none", cursor: "pointer",
              color: "#e53935", fontSize: 14,
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
             {deleting ? "Deleting..." : "Delete post"}
          </button>
          {/* <button
            style={{
              width: "100%", padding: "10px 16px", textAlign: "left",
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-primary)", fontSize: 14,
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            Edit post
          </button> */}
        </div>
      )}
    </div>
  )}
</div>
          
        </div>
      </div>

      <div className="postFeedActivity">
        <p style={{ color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
  {post.post_text}
</p>
        {/* image — click opens lightbox */}
        {post.media_url && post.media_type === "image" && (
          <div
            className="ImgOrVideo"
            style={{ cursor: "zoom-in" }}
            onClick={() => setLightboxSrc(post.media_url)}
          >
            <img
              src={post.media_url}
              alt="post"
              onError={(e) => { e.target.parentElement.style.display = "none"; }}
            />
          </div>
        )}

        {/* video — autoplay, mute toggle, click → reels */}
        {post.media_url && post.media_type === "video" && (
          <VideoThumb src={post.media_url} postId={post.id} />
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

            <EqualizerOutlinedIcon style={{ color: "var(--accent)" }} />
          <p className="pUsername" style={{ color: "var(--text-primary)" }}>
            {post.views_count || 0}
          </p>

            <div onClick={() => onBookmarkToggle(post)} style={{ cursor: "pointer" }}>
              {isBookmarked
                ? <BookmarkIcon style={{ color: "var(--accent)" }} />
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

      {/* fullscreen image lightbox */}
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      {showCommentModal && (
        <CommentModal
          post={post}
          onClose={() => setShowCommentModal(false)}
          onCommentAdded={() => setLocalCommentsCount(prev => prev + 1)}
        />
      )}
    </div>
  );
}
