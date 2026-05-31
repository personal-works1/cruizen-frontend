import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../Authentication/Authentication"
import { useAuth } from "../Context/AuthContext"
import PostCard from "../Home/PostCard"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"


export default function PostDetailPage() {
  const { postId }          = useParams()
  const { getValidToken }   = useAuth()
  const navigate            = useNavigate()
  const [post, setPost]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [openComments, setOpenComments] = useState(false)
  const [searchParams]  = useSearchParams()

useEffect(() => {
  if (post && searchParams.get("comments") === "open") {
    setOpenComments(true)
  }
}, [post])

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getValidToken()
        const res = await axios.get(`${API_URL}/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPost(res.data.post)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [postId])

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
      setPost(prev => ({
        ...prev,
        liked_by_me: !liked,
        likes_count: liked ? prev.likes_count - 1 : prev.likes_count + 1
      }))
    } catch (err) { console.error(err) }
  }

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
      setPost(prev => ({
        ...prev,
        reposted_by_me: !reposted,
        reposts_count: reposted ? prev.reposts_count - 1 : prev.reposts_count + 1
      }))
    } catch (err) { console.error(err) }
  }

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
      setPost(prev => ({
        ...prev,
        bookmarked_by_me: !bookmarked,
        bookmarks_count: bookmarked ? prev.bookmarks_count - 1 : prev.bookmarks_count + 1
      }))
    } catch (err) { console.error(err) }
  }

  if (loading) return <p style={{ textAlign: "center", marginTop: "2rem" }}>Loading post...</p>
  if (!post)   return <p style={{ textAlign: "center", marginTop: "2rem" }}>Post not found.</p>

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem" }}>
      {/* ── back button ── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "6px",
          color: "#61027b", fontWeight: 600, marginBottom: "1rem"
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 20 }} /> Back
      </button>

      <PostCard
        post={post}
        onLikeToggle={handleLikeToggle}
        onRepostToggle={handleRepostToggle}
        onBookmarkToggle={handleBookmarkToggle}
        // ── auto open comments if navigated from a comment notification ──
        autoOpenComments={openComments}
      />
    </div>
  )
}