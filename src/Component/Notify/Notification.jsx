import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { API_URL } from "../Authentication/Authentication";
import { useAuth } from "../Context/AuthContext";
import UserAvatar from "../Common/UserAvatar";
import "./Notification.css";

import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import RepeatIcon from "@mui/icons-material/Repeat";

// ── Cache helpers (90 s TTL — notifications are time-sensitive) ───────────────
const CACHE_KEY = "notif_cache";
const CACHE_TTL = 90_000;

function getCached() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { return null; }
}

function setCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

function bustCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch {}
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function NotifSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="notifItem" style={{ pointerEvents: "none" }}>
          <div className="notifAvatar">
            <div className="skelCircle" style={{ width: 42, height: 42, borderRadius: "50%" }} />
          </div>
          <div className="notifContent" style={{ gap: 6 }}>
            <div className="skelLine" style={{ width: "65%", height: 13 }} />
            <div className="skelLine" style={{ width: "30%", height: 11 }} />
          </div>
        </div>
      ))}
    </>
  );
}

// ── Icons + Messages (unchanged) ──────────────────────────────────────────────
function NotificationIcon({ type }) {
  if (type === "like")       return <FavoriteIcon sx={{ fontSize: 16, color: "red" }} />;
  if (type === "comment")    return <CommentOutlinedIcon sx={{ fontSize: 16, color: "#9c01c6" }} />;
  if (type === "follow")     return <PersonAddOutlinedIcon sx={{ fontSize: 16, color: "#17bf63" }} />;
  if (type === "repost")     return <RepeatIcon sx={{ fontSize: 16, color: "#61027b" }} />;
  if (type === "order")      return <ShoppingBagOutlinedIcon sx={{ fontSize: 16, color: "#61027b" }} />;
  if (type === "delivery")   return <LocalShippingOutlinedIcon sx={{ fontSize: 16, color: "#17bf63" }} />;
  if (type === "review")     return <StarOutlinedIcon sx={{ fontSize: 16, color: "#f5a623" }} />;
  if (type === "topup")      return <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 16, color: "#17bf63" }} />;
  if (type === "withdrawal") return <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 16, color: "#f5a623" }} />;
  if (type === "transfer")   return <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 16, color: "#61027b" }} />;
  if (type === "purchase")   return <ShoppingBagOutlinedIcon sx={{ fontSize: 16, color: "#17bf63" }} />;
  return null;
}

function NotificationMessage({ type, senderName, postText }) {
  if (type === "like")       return <span><strong>{senderName}</strong> liked your post {postText && `"${postText?.slice(0, 30)}..."`}</span>;
  if (type === "comment")    return <span><strong>{senderName}</strong> commented on your post</span>;
  if (type === "follow")     return <span><strong>{senderName}</strong> started following you</span>;
  if (type === "repost")     return <span><strong>{senderName}</strong> reposted your post</span>;
  if (type === "order")      return <span><strong>{senderName}</strong> placed an order on your product</span>;
  if (type === "delivery")   return <span>Your order from <strong>{senderName}</strong> has been marked delivered</span>;
  if (type === "review")     return <span><strong>{senderName}</strong> left you a review</span>;
  if (type === "topup")      return <span>Your wallet has been topped up successfully</span>;
  if (type === "withdrawal") return <span>Your withdrawal has been processed</span>;
  if (type === "transfer")   return <span><strong>{senderName}</strong> sent you a wallet transfer</span>;
  if (type === "purchase")   return <span>Your order for <strong>{senderName}</strong>'s product was placed successfully</span>;
  return <span>New notification</span>;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Notifications() {
  const { token } = useAuth();
  const navigate  = useNavigate();
  const authHeader = { Authorization: `Bearer ${token}` };

  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);

  // ── fetch with cache ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      // 1. show cached immediately
      const cached = getCached();
      if (cached) {
        setNotifications(cached);
        setLoading(false);
      }

      // 2. always revalidate in background (notifications change fast)
      try {
        const res = await axios.get(`${API_URL}/notifications`, { headers: authHeader });
        const fresh = res.data.notifications;
        setNotifications(fresh);
        setCache(fresh);

        // mark all read
        await axios.put(`${API_URL}/notifications/read-all`, {}, { headers: authHeader });
        // update cache to reflect read state
        const read = fresh.map(n => ({ ...n, is_read: true }));
        setNotifications(read);
        setCache(read);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleClick = (notif) => {
    // mark read locally + bust cache
    setNotifications(prev =>
      prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
    );
    bustCache();

    axios.put(`${API_URL}/notifications/${notif.id}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});

    if (notif.type === "follow") {
      navigate(`/profile/${notif.sender_username}`);
    } else if (notif.type === "like" || notif.type === "repost") {
      if (notif.post_id) navigate(`/post/${notif.post_id}`);
    } else if (notif.type === "comment") {
      if (notif.post_id) navigate(`/post/${notif.post_id}?comments=open`);
    } else if (["order", "delivery", "review", "purchase"].includes(notif.type)) {
      if (notif.order_id) navigate(`/order/${notif.order_id}`);
      else navigate("/Cart");
    } else if (["topup", "withdrawal", "transfer"].includes(notif.type)) {
      navigate("/wallet");
    }
  };

  const handleMarkAll = async () => {
    await axios.put(`${API_URL}/notifications/read-all`, {}, { headers: authHeader });
    const updated = notifications.map(n => ({ ...n, is_read: true }));
    setNotifications(updated);
    setCache(updated);
  };

  return (
    <div className="notificationsPage">
      <div className="notificationsContainer">
        <div className="notificationsHeader">
          <h2>Notifications</h2>
          {notifications.some(n => !n.is_read) && (
            <button className="markAllBtn" onClick={handleMarkAll}>
              <DoneAllIcon sx={{ fontSize: 16 }} /> Mark all read
            </button>
          )}
        </div>

        {/* skeleton while first load (no cache) */}
        {loading && notifications.length === 0 && <NotifSkeleton />}

        {!loading && notifications.length === 0 && (
          <p className="notifStatus">No notifications yet.</p>
        )}

        {notifications.map((n) => (
          <div
            key={n.id}
            className={`notifItem ${!n.is_read ? "unread" : ""}`}
            onClick={() => handleClick(n)}
          >
            <div className="notifAvatar">
              <UserAvatar avatar_url={n.sender_avatar} size={42} />
              <div className="notifTypeIcon">
                <NotificationIcon type={n.type} />
              </div>
            </div>
            <div className="notifContent">
              <NotificationMessage
                type={n.type}
                senderName={n.sender_name}
                postText={n.post_text}
              />
              <span className="notifTime">
                {new Date(n.created_at).toLocaleDateString("en-NG", {
                  day: "numeric", month: "short",
                  hour: "2-digit", minute: "2-digit"
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
