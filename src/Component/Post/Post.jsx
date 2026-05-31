import { useState, useRef } from "react";
import axios from "axios";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseIcon from "@mui/icons-material/Close";
import "./Post.css";
import { API_URL } from "../Authentication/Authentication";
import { useAuth } from "../Context/AuthContext";
import { useMode } from "../Context/modeContext"; // ← import mode
import UserAvatar from "../Common/UserAvatar";    // ← swap AccountCircleIcon for real avatar

export default function CreatePostModal({ onClose, onPostCreated }) {
  const [text, setText]           = useState("");
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [mediaType, setMediaType] = useState("none");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const fileRef                   = useRef();

  // ── who is posting — personal or business identity ───────────────────
const { getValidToken } = useAuth()
const { activeIdentity } = useMode()

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setMediaType(f.type.startsWith("video/") ? "video" : "image");
    setPreview(URL.createObjectURL(f));
  };

  const clearMedia = () => {
    setFile(null);
    setPreview(null);
    setMediaType("none");
    fileRef.current.value = "";
  };

const handleSubmit = async () => {
  if (!text && !file) return;
  setLoading(true);
  setError("");

  try {
    // ── get fresh token before every request ─────────────────────────
    const token = await getValidToken()
    const authHeader = { Authorization: `Bearer ${token}` }

    let media_url = null;

    if (file) {
      const allowedImages = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      const allowedVideos = ["video/mp4", "video/webm"]
      const allAllowed    = [...allowedImages, ...allowedVideos]

      if (!allAllowed.includes(file.type)) {
        const ext = file.name.split(".").pop().toUpperCase()
        setError(`${ext} files are not supported. Please use JPG, PNG, WEBP, GIF, MP4 or WEBM`)
        setLoading(false)
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        setError("File is too large. Maximum size is 50MB")
        setLoading(false)
        return
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const uploadRes = await axios.post(`${API_URL}/upload`, formData, {
          headers: { ...authHeader, "Content-Type": "multipart/form-data" },
        });
        media_url = uploadRes.data.url;
      } catch (uploadErr) {
        const msg = uploadErr.response?.data?.error || "File upload failed. Please try again."
        setError(msg)
        setLoading(false)
        return
      }
    }

    const res = await axios.post(
      `${API_URL}/posts/create`,
      {
        post_text:   text,
        media_type:  mediaType,
        media_url,
        author_type: activeIdentity.type,      // ← business or personal
        vendor_id:   activeIdentity.vendor_id, // ← null if personal
      },
      { headers: { ...authHeader, "Content-Type": "application/json" } }
    );

    onPostCreated?.(res.data.post);
    onClose();

  } catch (err) {
    const msg = err.response?.data?.error || "Something went wrong. Try again.";
    setError(msg);
  } finally {
    setLoading(false);
  }
};

  const charOver = text.length > 260;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="compose-modal">
        <div className="compose-header">
          <span>Create post</span>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="compose-body">
          {/* ── shows shop logo in business mode, personal avatar in personal ── */}
          <UserAvatar avatar_url={activeIdentity.avatar_url} size={42} />

          <div className="compose-right">
            {/* ── shows who is posting so user always knows which identity ── */}
            <p className="composing-as">
              Posting as <strong>{activeIdentity.username}</strong>
              {activeIdentity.type === "business" && (
                <span className="business-badge"> 🏪</span>
              )}
            </p>

            <textarea
              placeholder="What's on your mind?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={280}
            />
            {preview && (
              <div className="media-preview">
                {mediaType === "video" ? (
                  <video src={preview} controls />
                ) : (
                  <img src={preview} alt="preview" />
                )}
                <button className="remove-media" onClick={clearMedia}>
                  <CloseIcon sx={{ fontSize: 14 }} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="compose-footer">
          <div className="footer-left">
            <label className="media-btn">
              <AddPhotoAlternateOutlinedIcon fontSize="small" />
              <span>Photo / Video</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFile}
                hidden
              />
            </label>
            {mediaType !== "none" && (
              <span className="media-tag">{mediaType}</span>
            )}
          </div>
          <div className="footer-right">
            <span className={`char-count ${charOver ? "over" : ""}`}>
              {text.length} / 280
            </span>
            <button
              className="post-btn"
              onClick={handleSubmit}
              disabled={loading || (!text && !file)}
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>

        {error && <p className="compose-error">{error}</p>}
      </div>
    </div>
  );
}