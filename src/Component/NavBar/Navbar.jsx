import React, { useState, useEffect, } from "react";
import axios from "axios";
import { API_URL } from "../Authentication/Authentication";
import "./nav.css";
import UserAvatar from "../Common/UserAvatar";
import { NavLink, useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import StorefrontIcon from "@mui/icons-material/Storefront";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HomeIcon from "@mui/icons-material/Home";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import ChatIcon from "@mui/icons-material/Chat";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import NotificationsIcon from "@mui/icons-material/Notifications";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import { useAuth } from "../Context/AuthContext";
import { useMode } from "../Context/modeContext";

export function HeadingSmallDevice() {
  return (

    
    <div className="headingSmallDevice">
      <h1 className="schoolAppSmallDevice">Cruizen</h1>

    
      <IconButton sx={{ borderRadius: "8px", padding: "8px 14px" }}>
        <NavLink className="Links" to={"/leaderboard"}>
          {({ isActive }) => (
            <>
              {isActive ? (
                <EmojiEventsIcon sx={{ fontSize: "30px" }} />
              ) : (
                <EmojiEventsOutlinedIcon sx={{ fontSize: "30px" }} />
              )}
              <span className="linkName">Ranks</span>
            </>
          )}
        </NavLink>
      </IconButton>
    </div>
  );
}

function NavBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // ── get mode and active identity from context ─────────────────────────
  const { mode, activeIdentity } = useMode();
  

  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const handleLogout = () => {
    logout();
    navigate("/usersignIn");
  };

  // ── notification unread count — polls every 30s ───────────────────────
  // ── notification unread count ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const res = await axios.get(`${API_URL}/notifications/unread-count`, {
        });
        setUnreadCount(res.data.count);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // ── message unread count ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchMessageCount = async () => {
      try {
        const res = await axios.get(`${API_URL}/messages/unread-count`, {
        });
        setUnreadMessages(res.data.count);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessageCount();
    const msgInterval = setInterval(fetchMessageCount, 30000);
    return () => clearInterval(msgInterval);
  }, [user]);

  //  const handleleaderboard = ()=>{
  //   alert(
  //     "Leaderboard Clicked"
  //   )
  //  }

  return (
    <>

    {!user && (
      <div className="guestBanner">
        <span>You're browsing as a guest.</span>
        <button onClick={() => navigate("/usersignIn")}>Sign in</button>
        {/* <button onClick={() => navigate("/usersignIn")} className="guestSignup">Sign up</button> */}
      </div>
    )}
      <div className="Heading">
        <h1 className="schoolApp UniName">Cruizen</h1>
   
      

        <div className="navBar">
          {/* ── Home ── */}
<IconButton sx={{ borderRadius: "8px", padding: "8px 14px" }}>
  <NavLink
    className="Links"
    to={"/"}
    onClick={(e) => {
      if (window.location.pathname === "/") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.dispatchEvent(new Event("home-refresh"));
      }
    }}
  >
    {({ isActive }) => (
      <>
        {isActive ? (
          <HomeIcon className="Icons" sx={{ fontSize: "30px" }} />
        ) : (
          <HomeOutlinedIcon className="Icons" sx={{ fontSize: "30px" }} />
        )}
        <span className="linkName">Home</span>
      </>
    )}
  </NavLink>
</IconButton>

          {/* ── Search ── */}
          <IconButton sx={{ borderRadius: "8px", padding: "8px 14px" }}>
            <NavLink className="Links" to={"/Search"}>
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <SearchIcon sx={{ fontSize: "30px" }} />
                  ) : (
                    <SearchOutlinedIcon sx={{ fontSize: "30px" }} />
                  )}
                  <span className="linkName">Search</span>
                </>
              )}
            </NavLink>
          </IconButton>

          {/* ── Messages ── */}
          <IconButton sx={{ borderRadius: "8px", padding: "8px 14px" }}>
            <NavLink className="Links" to={"/messages"}>
              {({ isActive }) => (
                <div style={{ position: "relative" }}>
                  {isActive ? (
                    <ChatIcon sx={{ fontSize: "30px" }} />
                  ) : (
                    <ChatOutlinedIcon sx={{ fontSize: "30px" }} />
                  )}
                  {unreadMessages > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        background: "red",
                        color: "#fff",
                        borderRadius: "50%",
                        width: 16,
                        height: 16,
                        fontSize: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                      }}
                    >
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          </IconButton>

          {/* ── Notifications ── */}
          <IconButton sx={{ borderRadius: "8px", padding: "8px 14px" }}>
            <NavLink className="Links" to={"/notifications"}>
              {({ isActive }) => (
                <>
                  <div style={{ position: "relative" }}>
                    {isActive ? (
                      <NotificationsIcon sx={{ fontSize: "30px" }} />
                    ) : (
                      <NotificationsOutlinedIcon sx={{ fontSize: "30px" }} />
                    )}
                    {unreadCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: -4,
                          right: -4,
                          background: "red",
                          color: "#fff",
                          borderRadius: "50%",
                          width: 16,
                          height: 16,
                          fontSize: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                        }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="linkName">Notifications</span>
                </>
              )}
            </NavLink>
          </IconButton>

          {/* ── Profile / Business ── */}
          {user && (
          <NavLink
            className="Links"
            to={`/profile/${user?.username}`}
            end // ← only active on exact match
          >
            {({ isActive }) => (
  <>
    <div style={{
      borderRadius: "50%",
      padding: "2px",
      background: isActive ? "white" : "transparent",
      display: "inline-flex",
    }}>
      <UserAvatar
        avatar_url={mode === "business" ? activeIdentity.avatar_url : user?.avatar_url}
        size={34}
      />
    </div>
    <span className="linkName">
      {mode === "business" ? "Business" : "Profile"}
    </span>
  </>
)}
          </NavLink>
          )}

            {/* ── Leaderboard ── */}
          <div className="leaderBoard">
        <IconButton sx={{ borderRadius: "8px", padding: "8px 14px" }}>
          <NavLink className="Links" to={"/leaderboard"}>
            {({ isActive }) => (
              <>
                {isActive ? (
                  <EmojiEventsIcon sx={{ fontSize: "30px" }} />
                ) : (
                  <EmojiEventsOutlinedIcon sx={{ fontSize: "30px" }} />
                )}
                <span className="linkName">Ranks</span>
              </>
            )}
          </NavLink>
        </IconButton>
        </div>

          {/* ── Marketplace ── */}
          <IconButton sx={{ borderRadius: "8px", padding: "8px 14px" }}>
            <NavLink className="Links" to={"/cart"}>
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <StorefrontRoundedIcon sx={{ fontSize: "30px" }} />
                  ) : (
                    <StorefrontIcon sx={{ fontSize: "30px" }} />
                  )}
                  <span className="linkName">Cart</span>
                </>
              )}
            </NavLink>
          </IconButton>
        </div>
      </div>
    </>
  );
}

export default NavBar;
