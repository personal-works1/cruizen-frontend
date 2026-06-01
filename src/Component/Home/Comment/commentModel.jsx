import { useState, useEffect } from "react";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import { API_URL } from "../../Authentication/Authentication";
import "./CommentModel.css";
import UserAvatar from "../../Common/UserAvatar";
import { useAuth } from "../../Context/AuthContext";
import { useMode } from "../../Context/modeContext";

export default function CommentModal({ post, onClose, onCommentAdded }) {
  const [comments, setComments]       = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading]         = useState(true);
  const [posting, setPosting]         = useState(false);
  const { getValidToken }             = useAuth() // ← use getValidToken not raw token
  const { activeIdentity }            = useMode()

    const profileUsername = post.real_username || post.username

  useEffect(() => {
    const fetchComments = async () => {
      try {
        // ── get fresh token before every request ─────────────────────
        const token = await getValidToken()
        const res = await axios.get(`${API_URL}/posts/${post.id}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setComments(res.data.comments);
      } catch (err) {
        console.error("Failed to load comments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [post.id]);

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      // ── get fresh token before posting ───────────────────────────
      const token = await getValidToken()
      const res = await axios.post(
        `${API_URL}/posts/${post.id}/comment`,
        {
          comment:     commentText,
          author_type: activeIdentity.type,
          vendor_id:   activeIdentity.vendor_id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newComment = {
        ...res.data.comment,
        username:   activeIdentity.username,
        name:       activeIdentity.name,
        avatar_url: activeIdentity.avatar_url,
      }
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
      onCommentAdded?.()
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div
      className="comment-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="comment-modal">
        <div className="comment-header">
          <div className="comment-header-post">
            <UserAvatar avatar_url={post.avatar_url} size={32} />
            <div>
              <strong>{post.username}</strong>
              <p>{post.post_text}</p>
            </div>
          </div>
          <button className="comment-close-btn" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="comment-list">
          {loading && <p className="comment-status">Loading comments...</p>}
          {!loading && comments.length === 0 && (
            <p className="comment-status">No comments yet. Be the first!</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="comment-item">
              <UserAvatar avatar_url={c.avatar_url} size={32} />
              <div className="comment-content">
                <strong onClick={() => navigate(`/Profile/${profileUsername}`)}>{c.username}</strong>
                <p>{c.comment}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="comment-input-row">
          <UserAvatar avatar_url={activeIdentity.avatar_url} size={32} onClick={() => navigate(`/Profile/${profileUsername}`)} />
          <input
            type="text"
            placeholder={`Comment as ${activeIdentity.username}...`}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
            className="comment-input"
            autoFocus
          />
          <button
            onClick={handlePostComment}
            disabled={posting || !commentText.trim()}
            className="comment-send-btn"
          >
            <SendIcon fontSize="small" />
          </button>
        </div>
      </div>
    </div>
  );
}