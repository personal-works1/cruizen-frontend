import { useState, useEffect } from "react";
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

import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined"
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined"
import StarOutlinedIcon from "@mui/icons-material/StarOutlined"
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined"
import RepeatIcon from "@mui/icons-material/Repeat"

function NotificationIcon({ type }) {
  if (type === "like")       return <FavoriteIcon sx={{ fontSize: 16, color: "red" }} />
  if (type === "comment")    return <CommentOutlinedIcon sx={{ fontSize: 16, color: "#9c01c6" }} />
  if (type === "follow")     return <PersonAddOutlinedIcon sx={{ fontSize: 16, color: "#17bf63" }} />
  if (type === "repost")     return <RepeatIcon sx={{ fontSize: 16, color: "#61027b" }} />
  if (type === "order")      return <ShoppingBagOutlinedIcon sx={{ fontSize: 16, color: "#61027b" }} />
  if (type === "delivery")   return <LocalShippingOutlinedIcon sx={{ fontSize: 16, color: "#17bf63" }} />
  if (type === "review")     return <StarOutlinedIcon sx={{ fontSize: 16, color: "#f5a623" }} />
  if (type === "topup")      return <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 16, color: "#17bf63" }} />
  if (type === "withdrawal") return <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 16, color: "#f5a623" }} />
  if (type === "transfer")   return <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 16, color: "#61027b" }} />
  if (type === "purchase") return <ShoppingBagOutlinedIcon sx={{ fontSize: 16, color: "#17bf63" }} />

  return null
}

function NotificationMessage({ type, senderName, postText }) {
  if (type === "like")       return <span><strong>{senderName}</strong> liked your post {postText && `"${postText?.slice(0, 30)}..."`}</span>
  if (type === "comment")    return <span><strong>{senderName}</strong> commented on your post</span>
  if (type === "follow")     return <span><strong>{senderName}</strong> started following you</span>
  if (type === "repost")     return <span><strong>{senderName}</strong> reposted your post</span>
  if (type === "order")      return <span><strong>{senderName}</strong> placed an order on your product</span>
  if (type === "delivery")   return <span>Your order from <strong>{senderName}</strong> has been marked delivered</span>
  if (type === "review")     return <span><strong>{senderName}</strong> left you a review</span>
  if (type === "topup")      return <span>Your wallet has been topped up successfully</span>
  if (type === "withdrawal") return <span>Your withdrawal has been processed</span>
  if (type === "transfer")   return <span><strong>{senderName}</strong> sent you a wallet transfer</span>
  if (type === "purchase") return <span>Your order for <strong>{senderName}</strong>'s product was placed successfully</span>
  return <span>New notification</span>
}
export default function Notifications() {
  const { token } = useAuth();
  const navigate  = useNavigate();
  const authHeader = { Authorization: `Bearer ${token}` };

  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_URL}/notifications`, { headers: authHeader });
        setNotifications(res.data.notifications);
        // mark all as read when page opens
        await axios.put(`${API_URL}/notifications/read-all`, {}, { headers: authHeader });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

const handleClick = (notif) => {
  // ── mark this notification as read ───────────────────────────────────
  axios.put(`${API_URL}/notifications/${notif.id}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }).catch(() => {})

  if (notif.type === "follow") {
    // ── follow → go to sender's profile ─────────────────────────────
    navigate(`/profile/${notif.sender_username}`)

  } else if (notif.type === "like" || notif.type === "repost") {
    // ── like/repost → go to that exact post ─────────────────────────
    if (notif.post_id) navigate(`/post/${notif.post_id}`)

  } else if (notif.type === "comment") {
    // ── comment → go to post with comments open ──────────────────────
    if (notif.post_id) navigate(`/post/${notif.post_id}?comments=open`)

  } else if (
    notif.type === "order"    ||
    notif.type === "delivery" ||
    notif.type === "review"   ||
    notif.type === "purchase"
  ) {
    // ── order related → go to order page ────────────────────────────
    if (notif.order_id) navigate(`/order/${notif.order_id}`)
    else navigate("/Cart")

  } else if (
    notif.type === "topup"      ||
    notif.type === "withdrawal" ||
    notif.type === "transfer"
  ) {
    // ── wallet related → go to wallet ────────────────────────────────
    navigate("/wallet")
  }
}

  return (
    <div className="notificationsPage">
      <div className="notificationsContainer">
        <div className="notificationsHeader">
          <h2>Notifications</h2>
          {notifications.some(n => !n.is_read) && (
            <button className="markAllBtn"
              onClick={async () => {
                await axios.put(`${API_URL}/notifications/read-all`, {}, { headers: authHeader });
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
              }}>
              <DoneAllIcon sx={{ fontSize: 16 }} /> Mark all read
            </button>
          )}
        </div>

        {loading && <p className="notifStatus">Loading...</p>}
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
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}