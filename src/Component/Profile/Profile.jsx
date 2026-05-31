import "./profile.css";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import UserAvatar from "../Common/UserAvatar";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import XIcon from "@mui/icons-material/X";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import LinkIcon from "@mui/icons-material/Link";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import StoreIcon from "@mui/icons-material/Store";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import RepeatIcon from "@mui/icons-material/Repeat";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useAuth } from "../Context/AuthContext";
import { useMode } from "../Context/modeContext";
import { API_URL } from "../Authentication/Authentication";
import PostCard from "../Home/PostCard";
import TrustCard from "./TrustCard";
import WinnerBadge from "../Leaderboard/WinnerBadge";

// ── Social Icons Block ────────────────────────────────────────────────────────
function SocialLinks({ data }) {
  if (!data) return null;
  const hasAny =
    data.whatsapp || data.instagram || data.tiktok || data.youtube ||
    data.x_twitter || data.spotify || data.other_1_url || data.other_2_url;
  if (!hasAny) return null;

  return (
    <div className="socialIcon">
      {data.whatsapp && (
        <a href={data.whatsapp} target="_blank" rel="noreferrer">
          <WhatsAppIcon sx={{ fontSize: 32, color: "var(--accent)" }} />
        </a>
      )}
      {data.instagram && (
        <a href={data.instagram} target="_blank" rel="noreferrer">
          <InstagramIcon sx={{ fontSize: 32, color: "var(--accent)" }} />
        </a>
      )}
      {data.tiktok && (
        <a href={data.tiktok} target="_blank" rel="noreferrer">
          <GraphicEqIcon sx={{ fontSize: 32, color: "var(--accent)" }} />
        </a>
      )}
      {data.youtube && (
        <a href={data.youtube} target="_blank" rel="noreferrer">
          <YouTubeIcon sx={{ fontSize: 32, color: "var(--accent)" }} />
        </a>
      )}
      {data.x_twitter && (
        <a href={data.x_twitter} target="_blank" rel="noreferrer">
          <XIcon sx={{ fontSize: 32, color: "var(--accent)" }} />
        </a>
      )}
      {data.spotify && (
        <a href={data.spotify} target="_blank" rel="noreferrer">
          <MusicNoteIcon sx={{ fontSize: 32, color: "var(--accent)" }} />
        </a>
      )}
      {data.other_1_url && (
        <a href={data.other_1_url} target="_blank" rel="noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "4px",
                   fontSize: "13px", color: "var(--accent)" }}>
          <LinkIcon sx={{ fontSize: 18 }} />
          {data.other_1_label || "Link"}
        </a>
      )}
      {data.other_2_url && (
        <a href={data.other_2_url} target="_blank" rel="noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "4px",
                   fontSize: "13px", color: "var(--accent)" }}>
          <LinkIcon sx={{ fontSize: 18 }} />
          {data.other_2_label || "Link"}
        </a>
      )}
    </div>
  );
}

// ── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({ profileUser, isBusinessView, onClose, onSave }) {
  const { token } = useAuth();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name:          isBusinessView
                     ? profileUser?.business_name || ""
                     : profileUser?.name || "",
    bio:           isBusinessView
                     ? profileUser?.business_description || ""
                     : profileUser?.bio || "",
    location:      profileUser?.location      || "",
    website:       profileUser?.website       || "",
    whatsapp:      profileUser?.whatsapp      || "",
    instagram:     profileUser?.instagram     || "",
    tiktok:        profileUser?.tiktok        || "",
    youtube:       profileUser?.youtube       || "",
    x_twitter:     profileUser?.x_twitter     || "",
    spotify:       profileUser?.spotify       || "",
    other_1_url:   profileUser?.other_1_url   || "",
    other_1_label: profileUser?.other_1_label || "",
    other_2_url:   profileUser?.other_2_url   || "",
    other_2_label: profileUser?.other_2_label || "",
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const socialPayload = {
    whatsapp:      form.whatsapp,
    instagram:     form.instagram,
    tiktok:        form.tiktok,
    youtube:       form.youtube,
    x_twitter:     form.x_twitter,
    spotify:       form.spotify,
    other_1_url:   form.other_1_url,
    other_1_label: form.other_1_label,
    other_2_url:   form.other_2_url,
    other_2_label: form.other_2_label,
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };

      if (isBusinessView) {
        // ── save vendor profile ───────────────────────────────────────
        const res = await axios.put(`${API_URL}/vendors/update`, {
          business_name:        form.name,
          business_description: form.bio,
        }, { headers });

        // ── save vendor social links ──────────────────────────────────
        await axios.put(`${API_URL}/vendors/social-links`, socialPayload, { headers });

        onSave({ ...res.data.vendor, ...socialPayload });

      } else {
        // ── save personal profile ─────────────────────────────────────
        const res = await axios.put(`${API_URL}/profile/update/me`, {
          name:     form.name,
          bio:      form.bio,
          location: form.location,
          website:  form.website,
        }, { headers });

        // ── save personal social links ────────────────────────────────
        await axios.put(`${API_URL}/profile/social-links`, socialPayload, { headers });

        onSave({ ...res.data.user, ...socialPayload });
      }
      

      onClose();
    } catch (err) {
      console.error("Save error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modalOverlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modalBox">
        <div className="modalTopRow">
          <h2>{isBusinessView ? "Edit Business" : "Edit Profile"}</h2>
          <button className="modalCloseBtn" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="field">
          <label>{isBusinessView ? "Business Name" : "Name"}</label>
          <input name="name" value={form.name} onChange={handleChange} />
        </div>

        <div className="field">
          <label>{isBusinessView ? "Description" : "Bio"}</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            placeholder={isBusinessView ? "Tell customers what you sell..." : "Tell people about yourself..."}
          />
        </div>

        {/* personal only fields */}
        {!isBusinessView && (
          <>
            <div className="field">
              <label>Location</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Lagos, Nigeria"
              />
            </div>
            <div className="field">
              <label>Website</label>
              <input
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="https://yoursite.com"
              />
            </div>
          </>
        )}

        {/* social links — same for both modes */}
        <div style={{
          borderTop: "1px solid var(--border)",
          margin: "12px 0 8px",
          paddingTop: "8px",
          fontSize: "13px",
          color: "#888",
          fontWeight: 600,
        }}>
          Social Links
        </div>

        {[
          { name: "whatsapp",  label: "WhatsApp",  placeholder: "https://wa.me/234..." },
          { name: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
          { name: "tiktok",    label: "TikTok",    placeholder: "https://tiktok.com/@..." },
          { name: "youtube",   label: "YouTube",   placeholder: "https://youtube.com/..." },
          { name: "x_twitter", label: "X (Twitter)", placeholder: "https://x.com/..." },
          { name: "spotify",   label: "Spotify",   placeholder: "https://open.spotify.com/..." },
        ].map(({ name, label, placeholder }) => (
          <div className="field" key={name}>
            <label>{label}</label>
            <input
              name={name}
              value={form[name]}
              onChange={handleChange}
              placeholder={placeholder}
            />
          </div>
        ))}

        <div className="field">
          <label>Other Link 1 — Label</label>
          <input
            name="other_1_label"
            value={form.other_1_label}
            onChange={handleChange}
            placeholder="e.g. My Podcast"
          />
        </div>
        <div className="field">
          <label>Other Link 1 — URL</label>
          <input
            name="other_1_url"
            value={form.other_1_url}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>
        <div className="field">
          <label>Other Link 2 — Label</label>
          <input
            name="other_2_label"
            value={form.other_2_label}
            onChange={handleChange}
            placeholder="e.g. My Linktree"
          />
        </div>
        <div className="field">
          <label>Other Link 2 — URL</label>
          <input
            name="other_2_url"
            value={form.other_2_url}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>

        {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}

        <div className="modalBtns">
          <button className="cancelBtn" onClick={onClose}>Cancel</button>
          <button className="submitBtn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cart Grid ─────────────────────────────────────────────────────────────────
function CartGrid({ isOwnProfile, isVendor }) {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_URL}/products/vendor/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(res.data.products);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (isOwnProfile && isVendor) fetchProducts();
    else setLoading(false);
  }, []);

  if (loading)
    return <p style={{ textAlign: "center", padding: "2rem", color: "#888" }}>Loading...</p>;

  return (
    <div className="cartContainer">
      {products.length === 0 && (
        <p style={{ gridColumn: "span 3", textAlign: "center", color: "#888", padding: "2rem" }}>
          {isVendor ? "No products yet. Go to Marketplace to upload!" : "No purchases yet."}
        </p>
      )}
      {products.map((p) => (
        <div key={p.id} className="postItem" style={{ position: "relative" }}>
          {p.image_url ? (
            <img src={p.image_url} alt={p.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div className="textPostThumb"><p>{p.name}</p></div>
          )}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "rgba(97,2,123,0.75)", padding: "6px 8px",
          }}>
            <p style={{ color: "#fff", fontSize: "12px", margin: 0, fontWeight: 600 }}>{p.name}</p>
            <p style={{ color: "#e2a9f1", fontSize: "11px", margin: 0 }}>
              ₦{Number(p.price).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { token, user: me, login, getValidToken, loading: authLoading } = useAuth();
  const { mode, activeIdentity, vendorProfile, setVendorProfile, switchMode } = useMode();

  const [profileData, setProfileData]       = useState(null);
  const [posts, setPosts]                   = useState([]);
  const [reposts, setReposts]               = useState([]);
  const [liked, setLiked]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [tabLoading, setTabLoading]         = useState(false);
  const [activeTab, setActiveTab]           = useState("posts");
  const [followPending, setFollowPending]   = useState(false);
  const [badges, setBadges] = useState([])
  const [showEditModal, setShowEditModal]   = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedPost, setSelectedPost]     = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [vendorForm, setVendorForm] = useState({
    business_name: "", business_email: "",
    business_category: "", business_description: "",
  });

  const authHeader = { Authorization: `Bearer ${token}` };
  const targetUsername = username || me?.username;
  const isOwnProfile = !username || username === me?.username;
  const isBusinessView = isOwnProfile && mode === "business";

  const displayName     = isBusinessView && vendorProfile ? vendorProfile.business_name      : profileData?.name;
  const displayUsername = isBusinessView && vendorProfile ? vendorProfile.business_username || vendorProfile.business_name : profileData?.username;
  const displayAvatar   = isBusinessView && vendorProfile?.avatar_url ? vendorProfile.avatar_url : profileData?.avatar_url;
  const displayBio      = isBusinessView && vendorProfile ? vendorProfile.business_category  : profileData?.bio;

  // ── Fetch profile ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!targetUsername || authLoading) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const freshToken = await getValidToken();
        if (!freshToken) return;
        const res = await axios.get(`${API_URL}/profile/${targetUsername}`, {
          headers: { Authorization: `Bearer ${freshToken}` },
        });
        setProfileData(res.data.user);
        if (res.data.user?.id) {
  try {
    const badgeRes = await axios.get(
      `${API_URL}/leaderboard/badges/${res.data.user.id}`,
      { headers: { Authorization: `Bearer ${freshToken}` } }
    )
    setBadges(badgeRes.data.badges)
  } catch {}
}
        setPosts(res.data.posts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [targetUsername, authLoading]);

  // ── Fetch tab content ─────────────────────────────────────────────────
  useEffect(() => {
    if (!profileData || activeTab === "posts") return;
    const fetchTab = async () => {
      setTabLoading(true);
      try {
        const tok = await getValidToken();
        const headers = { Authorization: `Bearer ${tok}` };
        if (activeTab === "reposts") {
          const res = await axios.get(`${API_URL}/profile/${profileData.username}/reposts`, { headers });
          setReposts(res.data.posts);
        }
        if (activeTab === "liked") {
          const res = await axios.get(`${API_URL}/profile/${profileData.username}/liked`, { headers });
          setLiked(res.data.posts);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setTabLoading(false);
      }
    };
    fetchTab();
  }, [activeTab, profileData]);

  // ── Follow / Unfollow ─────────────────────────────────────────────────
  const handleFollowToggle = async () => {
    if (followPending) return;
    setFollowPending(true);
    const isFollowing = profileData.is_following;
    try {
      if (isFollowing) {
        await axios.delete(`${API_URL}/profile/${profileData.username}/follow`, { headers: authHeader });
      } else {
        await axios.post(`${API_URL}/profile/${profileData.username}/follow`, {}, { headers: authHeader });
      }
      setProfileData((prev) => ({
        ...prev,
        is_following: !isFollowing,
        followers_count: isFollowing ? prev.followers_count - 1 : prev.followers_count + 1,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setFollowPending(false);
    }
  };

  // ── Profile saved callback ────────────────────────────────────────────
  const handleProfileSaved = (updatedData) => {
    if (isBusinessView) {
      // update vendorProfile in ModeContext — includes social links
      setVendorProfile((prev) => ({ ...prev, ...updatedData }));
    } else {
      // update personal profile data + auth context
      setProfileData((prev) => ({ ...prev, ...updatedData }));
       if (me) {
      login(token, { ...me, ...updatedData })
       }
    }
  };

  // ── Avatar upload ─────────────────────────────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      if (isBusinessView) {
        const tok = await getValidToken();
        const res = await axios.post(`${API_URL}/vendors/avatar`, formData, {
          headers: { Authorization: `Bearer ${tok}`, "Content-Type": "multipart/form-data" },
        });
        setVendorProfile((prev) => ({ ...prev, avatar_url: res.data.avatar_url }));
      } else {
        const res = await axios.post(`${API_URL}/profile/avatar`, formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        setProfileData((prev) => ({ ...prev, avatar_url: res.data.avatar_url }));
        login(token, { ...me, avatar_url: res.data.avatar_url });
      }
    } catch (err) {
      console.error("Avatar upload failed", err);
      alert(err.response?.data?.error || "Upload failed");
    } finally {
      setAvatarUploading(false);
      avatarInputRef.current.value = "";
    }
  };

  // ── Avatar delete ─────────────────────────────────────────────────────
  const handleAvatarDelete = async () => {
    if (!window.confirm("Remove profile picture?")) return;
    try {
      if (isBusinessView) {
        const tok = await getValidToken();
        await axios.delete(`${API_URL}/vendors/avatar`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        setVendorProfile((prev) => ({ ...prev, avatar_url: null }));
      } else {
        await axios.delete(`${API_URL}/profile/avatar`, { headers: authHeader });
        setProfileData((prev) => ({ ...prev, avatar_url: null }));
        login(token, { ...me, avatar_url: null });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Post interaction handlers ─────────────────────────────────────────
  const handleLikeToggle = async (post) => {
    const isLiked = post.liked_by_me;
    try {
      if (isLiked) {
        await axios.delete(`${API_URL}/posts/${post.id}/like`, { headers: authHeader });
      } else {
        await axios.post(`${API_URL}/posts/${post.id}/like`, {}, { headers: authHeader });
      }
      const update = (p) => p.id === post.id
        ? { ...p, liked_by_me: !isLiked, likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1 }
        : p;
      setPosts((prev) => prev.map(update));
      if (selectedPost?.id === post.id) setSelectedPost((prev) => update(prev));
    } catch (err) { console.error(err); }
  };

  const handleRepostToggle = async (post) => {
    const isReposted = post.reposted_by_me;
    try {
      if (isReposted) {
        await axios.delete(`${API_URL}/posts/${post.id}/repost`, { headers: authHeader });
      } else {
        await axios.post(`${API_URL}/posts/${post.id}/repost`, {}, { headers: authHeader });
      }
      const update = (p) => p.id === post.id
        ? { ...p, reposted_by_me: !isReposted, reposts_count: isReposted ? p.reposts_count - 1 : p.reposts_count + 1 }
        : p;
      setPosts((prev) => prev.map(update));
      if (selectedPost?.id === post.id) setSelectedPost((prev) => update(prev));
    } catch (err) { console.error(err); }
  };

  const handleBookmarkToggle = async (post) => {
    const isBookmarked = post.bookmarked_by_me;
    try {
      if (isBookmarked) {
        await axios.delete(`${API_URL}/posts/${post.id}/bookmark`, { headers: authHeader });
      } else {
        await axios.post(`${API_URL}/posts/${post.id}/bookmark`, {}, { headers: authHeader });
      }
      const update = (p) => p.id === post.id
        ? { ...p, bookmarked_by_me: !isBookmarked, bookmarks_count: isBookmarked ? p.bookmarks_count - 1 : p.bookmarks_count + 1 }
        : p;
      setPosts((prev) => prev.map(update));
      if (selectedPost?.id === post.id) setSelectedPost((prev) => update(prev));
    } catch (err) { console.error(err); }
  };

  // ── Vendor form ───────────────────────────────────────────────────────
  const handleVendorChange = (e) =>
    setVendorForm({ ...vendorForm, [e.target.name]: e.target.value });

  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/vendors/create`, vendorForm, { headers: authHeader });
      login(token, { ...me, role: "both", businessName: response.data.vendor.business_name });
      setShowVendorModal(false);
      alert("Business profile created!");
    } catch (err) {
      alert(err.response?.data?.error || "Something went wrong");
    }
  };

  // ── Message ───────────────────────────────────────────────────────────
  const handleMessage = async () => {
    if (!token) { navigate("/usersignIn"); return; }
    try {
      const res = await axios.post(`${API_URL}/messages/conversation`,
        { user2: profileData.id }, { headers: authHeader });
      navigate(`/messages/${res.data.conversation.id}`);
    } catch (err) { console.error(err); }
  };

  // ── Post grid render helper ───────────────────────────────────────────
  const renderPostGrid = (items, emptyMsg) => (
    <div className="postContainer">
      {items.length === 0 && (
        <p style={{ textAlign: "center", color: "#888", gridColumn: "span 3", padding: "2rem" }}>
          {emptyMsg}
        </p>
      )}
      {items.map((post) => (
        <div key={post.id} className="postItem"
          onClick={() => setSelectedPost(post)} style={{ cursor: "pointer" }}>
          {post.media_type === "image" && post.media_url && (
            <img src={post.media_url} alt="post"
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          {post.media_type === "video" && post.media_url && (
            <video src={post.media_url}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          {(!post.media_url || post.media_type === "none") && (
            <div className="textPostThumb"><p>{post.post_text}</p></div>
          )}
        </div>
      ))}
    </div>
  );

  if (loading)
    return <p style={{ textAlign: "center", marginTop: "2rem" }}>Loading profile...</p>;
  if (!profileData)
    return <p style={{ textAlign: "center", marginTop: "2rem" }}>User not found.</p>;

  return (
    <>
      <div className="profileMain">
        <div className="userProfileInfo">

          {/* ── Avatar + settings ── */}
          <div className="profileCard" style={{ position: "relative", width: "100%" }}>
            <div className="avatarWrapper">
              <UserAvatar
                avatar_url={isOwnProfile && mode === "business"
                  ? activeIdentity.avatar_url
                  : profileData.avatar_url}
                size={150}
              />

              {isOwnProfile && (
                <>
                  <button
                    onClick={() => navigate("/settings")}
                    style={{
                      position: "absolute", top: "0", right: "-7rem",
                      background: "none", border: "none", cursor: "pointer",
                      color: "#61027b", display: "flex", alignItems: "center",
                      padding: "4px", borderRadius: "50%", transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f5e6ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <SettingsOutlinedIcon sx={{ fontSize: 26 }} />
                  </button>

                  <div className="avatarActions">
                    <button className="avatarUploadBtn"
                      onClick={() => avatarInputRef.current.click()}
                      disabled={avatarUploading} title="Change photo">
                      {avatarUploading ? "..." : <AddAPhotoIcon sx={{ fontSize: 16 }} />}
                    </button>
                    {displayAvatar && (
                      <button className="avatarDeleteBtn"
                        onClick={handleAvatarDelete} title="Remove photo">
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </button>
                    )}
                  </div>
                </>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*"
                hidden onChange={handleAvatarUpload} />
            </div>

            <p><strong>@{displayUsername}</strong></p>
            <p>{displayName}</p>
            <WinnerBadge badges={badges} size="large" />
            {displayBio && <p className="profileBio">{displayBio}</p>}

            <div className="profileMeta">
              {profileData.location && (
                <span>
                  <LocationOnOutlinedIcon sx={{ fontSize: 16 }} />
                  {profileData.location}
                </span>
              )}
              {profileData.website && (
                <a href={profileData.website} target="_blank" rel="noreferrer">
                  <LinkOutlinedIcon sx={{ fontSize: 16 }} />
                  {profileData.website}
                </a>
              )}
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="accPortfolio">
            <div className="portfolioCount">
              <p>{profileData.posts_count}</p>
              <button>{isBusinessView ? "Products" : "Posts"}</button>
            </div>
            <div className="portfolioCount">
              <p>{profileData.followers_count}</p>
              <button>{isBusinessView ? "Orders" : "Followers"}</button>
            </div>
            <div className="portfolioCount">
              <p>{profileData.following_count}</p>
              <button>{isBusinessView ? "Sales" : "Following"}</button>
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div className="threeBtns">
            {isOwnProfile ? (
              <button className="BFM" onClick={() => setShowEditModal(true)}>
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
                {isBusinessView ? "Edit Business" : "Edit Profile"}
              </button>
            ) : (
              <button
                className={`BFM ${profileData.is_following ? "following" : ""}`}
                onClick={handleFollowToggle}
                disabled={followPending}
              >
                {profileData.is_following ? "Unfollow" : "Follow"}
              </button>
            )}

            {!isOwnProfile && (
              <button className="BFM" onClick={handleMessage}>Message</button>
            )}

            {isOwnProfile && me?.role === "user" && (
              <button className="vendorBtn" onClick={() => setShowVendorModal(true)}>
                <StoreIcon sx={{ fontSize: 18 }} /> Become a Vendor
              </button>
            )}

            {isOwnProfile && (me?.role === "both" || me?.role === "vendor") && (
              <button className="vendorBtn active" onClick={switchMode}>
                <StoreIcon sx={{ fontSize: 18 }} />
                {mode === "personal" ? "Switch to Business" : "Switch to Personal"}
              </button>
            )}
          </div>

          {/* ── Social links — personal ── */}
          {!isBusinessView && <SocialLinks data={profileData} />}

          {/* ── Social links — business ── */}
          {isBusinessView && <SocialLinks data={vendorProfile} />}

          {/* ── Show on profile toggle — business mode owner only ── */}
          {isOwnProfile && isBusinessView && vendorProfile && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              fontSize: "13px", color: "#888", marginTop: "0.5rem",
            }}>
              <span>Show shop on personal profile</span>
              <input
                type="checkbox"
                checked={vendorProfile.show_on_profile || false}
                onChange={async (e) => {
                  const val = e.target.checked;
                  try {
                    const tok = await getValidToken();
                    await axios.put(`${API_URL}/vendors/settings/show-on-profile`,
                      { show_on_profile: val },
                      { headers: { Authorization: `Bearer ${tok}` } });
                    setVendorProfile((prev) => ({ ...prev, show_on_profile: val }));
                  } catch (err) { console.error(err); }
                }}
              />
            </div>
          )}

          {/* ── Trust card — business mode owner only ── */}
          {isOwnProfile &&
            (profileData.role === "vendor" || profileData.role === "both") &&
            mode === "business" && (
              <TrustCard username={profileData.username} />
            )}

          {/* ── Visit Shop button — other users viewing a vendor ── */}
          {!isOwnProfile &&
            (profileData.role === "vendor" || profileData.role === "both") &&
            profileData.show_on_profile && (
              <button
                onClick={() => navigate(`/shop/${
                  profileData.business_name?.toLowerCase().replace(/ /g, "-")
                }`)}
                style={{
                  background: "#61027b", color: "#fff", border: "none",
                  borderRadius: "20px", padding: "8px 20px", cursor: "pointer",
                  fontWeight: 600, marginTop: "0.5rem", display: "flex",
                  alignItems: "center", gap: "6px", fontSize: "14px",
                }}
              >
                <StoreIcon sx={{ fontSize: 16 }} /> Visit Shop
              </button>
            )}
        </div>

        {/* ── Right: Tabs + content ── */}
        <div className="postORcart">
          <div className="pages">
            <button onClick={() => setActiveTab("posts")}
              className={activeTab === "posts" ? "profileTab active" : "profileTab"}>
              <AddAPhotoIcon sx={{ fontSize: 24 }} /><span>Posts</span>
            </button>
            <button onClick={() => setActiveTab("reposts")}
              className={activeTab === "reposts" ? "profileTab active" : "profileTab"}>
              <RepeatIcon sx={{ fontSize: 24 }} /><span>Reposts</span>
            </button>
            {isOwnProfile && (
              <button onClick={() => setActiveTab("liked")}
                className={activeTab === "liked" ? "profileTab active" : "profileTab"}>
                <FavoriteIcon sx={{ fontSize: 24 }} /><span>Liked</span>
              </button>
            )}
            {isBusinessView && (
              <button onClick={() => setActiveTab("products")}
                className={activeTab === "products" ? "profileTab active" : "profileTab"}>
                <StoreIcon sx={{ fontSize: 24 }} /><span>Products</span>
              </button>
            )}
          </div>

          {tabLoading && (
            <p style={{ textAlign: "center", padding: "2rem", color: "#888" }}>Loading...</p>
          )}

          {!tabLoading && activeTab === "posts"   && renderPostGrid(posts,   "No posts yet.")}
          {!tabLoading && activeTab === "reposts" && renderPostGrid(reposts, "No reposts yet.")}
          {!tabLoading && activeTab === "liked" && isOwnProfile && renderPostGrid(liked, "No liked posts yet.")}
          {!tabLoading && activeTab === "products" && isBusinessView && (
            <CartGrid isOwnProfile={isOwnProfile} isVendor={true} />
          )}
        </div>
      </div>

      {/* ── Post Detail Modal ── */}
      {selectedPost && (
        <div className="modalOverlay" onClick={() => setSelectedPost(null)}>
          <div className="postDetailModal" onClick={(e) => e.stopPropagation()}>
            <button className="modalCloseBtn"
              style={{ alignSelf: "flex-end", marginBottom: "8px" }}
              onClick={() => setSelectedPost(null)}>
              <CloseIcon />
            </button>
            <PostCard
              post={{ ...selectedPost, username: profileData.username, name: profileData.name }}
              onLikeToggle={handleLikeToggle}
              onRepostToggle={handleRepostToggle}
              onBookmarkToggle={handleBookmarkToggle}
            />
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {showEditModal && (
        <EditProfileModal
          profileUser={isBusinessView ? vendorProfile : profileData}
          isBusinessView={isBusinessView}
          onClose={() => setShowEditModal(false)}
          onSave={handleProfileSaved}
        />
      )}

      {/* ── Become Vendor Modal ── */}
      {showVendorModal && (
        <div className="modalOverlay" onClick={() => setShowVendorModal(false)}>
          <div className="modalBox" onClick={(e) => e.stopPropagation()}>
            <h2>Become a Vendor</h2>
            <p className="modalSubtitle">Set up your business profile</p>
            <form onSubmit={handleVendorSubmit}>
              <div className="field">
                <label>Business Name</label>
                <input type="text" name="business_name"
                  placeholder={`${me?.name} Stores`}
                  onChange={handleVendorChange} required />
              </div>
              <div className="field">
                <label>Business Email</label>
                <input type="email" name="business_email"
                  placeholder="store@example.com"
                  onChange={handleVendorChange} required />
              </div>
              <div className="field">
                <label>Business Category</label>
                <select name="business_category" onChange={handleVendorChange} required>
                  <option value="">Select category</option>
                  <option>Fashion & Clothing</option>
                  <option>Electronics & Gadgets</option>
                  <option>Food & Drinks</option>
                  <option>Beauty & Skincare</option>
                  <option>Books & Stationery</option>
                  <option>Services</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="field">
                <label>Business Description <span className="optional">(optional)</span></label>
                <textarea name="business_description"
                  placeholder="Tell customers what you sell..."
                  onChange={handleVendorChange} rows={3} />
              </div>
              <div className="modalBtns">
                <button type="button" className="cancelBtn"
                  onClick={() => setShowVendorModal(false)}>Cancel</button>
                <button type="submit" className="submitBtn">Create Business Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Profile;
