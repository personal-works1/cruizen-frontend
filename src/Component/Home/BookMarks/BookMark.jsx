import { useState, useEffect } from "react"
import axios from "axios"
import { API_URL } from "../../Authentication/Authentication"
import PostCard from "../PostCard"

export default function Bookmarks() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_URL}/posts/bookmarks`)
        setPosts(res.data.posts)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleBookmarkToggle = async (post) => {
    await axios.delete(`${API_URL}/posts/${post.id}/bookmark`)
    setPosts((prev) => prev.filter((p) => p.id !== post.id)) // remove from page instantly
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem" }}>
      <h2>Bookmarks</h2>
      {loading && <p>Loading...</p>}
      {!loading && posts.length === 0 && <p>No bookmarks yet.</p>}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLikeToggle={() => {}}
          onRepostToggle={() => {}}
          onBookmarkToggle={handleBookmarkToggle}
        />
      ))}
    </div>
  )
}