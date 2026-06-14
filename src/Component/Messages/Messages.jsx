import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../Context/AuthContext";
import { useMode } from "../Context/modeContext";
import { useSocket } from "../Context/SocketContext";
import { API_URL } from "../Authentication/Authentication";
import UserAvatar from "../Common/UserAvatar";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import CircleIcon from "@mui/icons-material/Circle";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import "./Messages.css";

// ── Skeleton components ───────────────────────────────────────────────────────
function ConversationItemSkeleton() {
  return (
    <div
      className="conversationItem"
      style={{ cursor: "default", pointerEvents: "none" }}
    >
      <div className="convAvatar">
        <div className="skelCircle shimmer" style={{ width: 48, height: 48 }} />
      </div>
      <div className="convInfo">
        <div className="convTopRow">
          <div
            className="skelLine shimmer"
            style={{ width: "120px", height: "13px" }}
          />
          <div
            className="skelLine shimmer"
            style={{ width: "28px", height: "11px" }}
          />
        </div>
        <div className="convBottomRow" style={{ marginTop: "6px" }}>
          <div
            className="skelLine shimmer"
            style={{ width: "180px", height: "12px" }}
          />
        </div>
      </div>
    </div>
  );
}

function ConversationListSkeleton() {
  return (
    <>
      {Array.from({ length: 7 }).map((_, i) => (
        <ConversationItemSkeleton key={i} />
      ))}
    </>
  );
}

function MessageBubbleSkeleton({ mine, wide }) {
  return (
    <div
      className={`messageBubbleWrapper ${mine ? "mine" : "theirs"}`}
      style={{ pointerEvents: "none" }}
    >
      {!mine && (
        <div
          className="skelCircle shimmer"
          style={{ width: 28, height: 28, flexShrink: 0 }}
        />
      )}
      <div
        className="skelLine shimmer"
        style={{
          width: wide ? "55%" : "35%",
          height: mine ? "38px" : "52px",
          borderRadius: "16px",
          maxWidth: "70%",
        }}
      />
    </div>
  );
}

function ChatSkeleton() {
  // Alternating pattern of mine/theirs bubbles
  const pattern = [
    { mine: false, wide: true },
    { mine: true, wide: false },
    { mine: false, wide: false },
    { mine: true, wide: true },
    { mine: false, wide: true },
    { mine: true, wide: false },
    { mine: false, wide: false },
    { mine: true, wide: true },
    { mine: false, wide: false },
  ];
  return (
    <div className="messagesList" style={{ pointerEvents: "none" }}>
      {pattern.map((p, i) => (
        <MessageBubbleSkeleton key={i} mine={p.mine} wide={p.wide} />
      ))}
    </div>
  );
}

// ── Main Messages ─────────────────────────────────────────────────────────────
export default function Messages() {
  const { getValidToken, user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useMode()

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [userSearching, setUserSearching] = useState(false);

  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(0);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageRefs = useRef({});

  const isVendor = user?.role === "both" || user?.role === "vendor"

const [activeTab, setActiveTab] = useState(
  (isVendor && location.state?.tab) ? location.state.tab :
  (isVendor && mode === "business") ? "business" : "personal"
)
  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user]);

  if (!user) return null;



  const openConvRef = useRef(location.state?.openConversation || null);
  const openTabRef = useRef(location.state?.tab || null);

  // ── fetch conversations ───────────────────────────────────────────────
const refetchRef = useRef(0)

useEffect(() => {
  if (!user) return
  let cancelled = false

  const fetch = async () => {
    setLoading(true)
    try {
      const token = await getValidToken()
      const res = await axios.get(
  `${API_URL}/messages/conversations?type=${activeTab}`,
  { headers: { Authorization: `Bearer ${token}` } }
)
      if (cancelled) return

      let convList = res.data.conversations

      if (openConvRef.current && (openTabRef.current === activeTab || !isVendor)) {
  const conv = openConvRef.current
  const exists = convList.find(c => c.id === conv.id)
  const enriched = exists || conv
  if (!exists) convList = [enriched, ...convList]
  setActiveConvId(enriched.id)
  setActiveConv(enriched)
  openConvRef.current = null
}

      setConversations(convList)
    } catch (err) {
      console.error(err)
    } finally {
      if (!cancelled) setLoading(false)
    }
  }

  fetch()
  return () => { cancelled = true }
}, [user, activeTab, refetchRef.current])




  // ── fetch messages when active conversation changes ───────────────────
  useEffect(() => {
    if (!activeConvId) return;
    const fetch = async () => {
      setMsgLoading(true);
      try {
        const token = await getValidToken();
        const res = await axios.get(
          `${API_URL}/messages/conversations/${activeConvId}/messages`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setMessages(res.data.messages);
      } catch (err) {
        console.error(err);
      } finally {
        setMsgLoading(false);
      }
    };
    fetch();
  }, [activeConvId]);

  // ── socket ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !activeConvId) return;
    socket.emit("join_conversation", activeConvId);
    socket.on("new_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });
    socket.on("user_typing", ({ userId }) => {
      if (userId !== user.id) setOtherTyping(true);
    });
    socket.on("user_stop_typing", ({ userId }) => {
      if (userId !== user.id) setOtherTyping(false);
    });
    return () => {
      socket.off("new_message");
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, [socket, activeConvId]);

  // ── scroll to bottom ──────────────────────────────────────────────────
  useEffect(() => {
    if (!showSearch) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ── in-chat message search ────────────────────────────────────────────
  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      setSearchIndex(0);
      return;
    }
    const q = searchText.toLowerCase();
    const results = messages
      .map((msg, index) => ({ ...msg, index }))
      .filter((msg) => msg.content?.toLowerCase().includes(q));
    setSearchResults(results);
    setSearchIndex(0);
    if (results.length > 0) {
      messageRefs.current[results[0].id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [searchText, messages]);

  // ── user search (new message) ─────────────────────────────────────────
  useEffect(() => {
    if (!userSearch.trim()) {
      setUserResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setUserSearching(true);
      try {
        const token = await getValidToken();
        const res = await axios.get(
          `${API_URL}/search?q=${userSearch}&type=users`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setUserResults(res.data.users || []);
      } catch (err) {
        console.error(err);
      } finally {
        setUserSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [userSearch]);

  // ── handlers ──────────────────────────────────────────────────────────
  const openConversation = (conv) => {
    setActiveConvId(conv.id);
    setActiveConv(conv);
    setMessages([]);
    setShowNewMessage(false);
    setShowSearch(false);
    setSearchText("");
  };

  const handleStartConversation = async (userId) => {
    try {
      const token = await getValidToken();
      const res = await axios.post(
        `${API_URL}/messages/conversation`,
        { user2: userId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const conv = res.data.conversation;
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        if (exists) return prev;
        return [conv, ...prev];
      });
      setActiveConvId(conv.id);
      setActiveConv(conv);
      setShowNewMessage(false);
      setUserSearch("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = () => {
    if (!input.trim() || !socket) return;
    socket.emit("send_message", {
      conversation_id: activeConvId,
      sender_id: user.id,
      content: input,
    });
    setInput("");
    socket.emit("stop_typing", {
      conversation_id: activeConvId,
      userId: user.id,
    });
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit("typing", {
      conversation_id: activeConvId,
      userId: user.id,
      username: user.username,
    });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        conversation_id: activeConvId,
        userId: user.id,
      });
    }, 1500);
  };

  const goToResult = (direction) => {
    const next =
      direction === "up"
        ? Math.max(0, searchIndex - 1)
        : Math.min(searchResults.length - 1, searchIndex + 1);
    setSearchIndex(next);
    messageRefs.current[searchResults[next].id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const highlight = (text, query) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          style={{
            background: "var(--accent-light)",
            color: "var(--accent)",
            borderRadius: "2px",
          }}
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  };

  const filtered = conversations.filter((conv) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      conv.other_name?.toLowerCase().includes(q) ||
      conv.other_username?.toLowerCase().includes(q)
    );
  });

  const isOnline = activeConv && onlineUsers?.has(activeConv.other_user_id);

  return (
    <div className="igLayout">
      {/* ── LEFT: conversation list ── */}
      <div className={`igLeft ${activeConvId ? "hidden-mobile" : ""}`}>
        <div className="messagesHeader">
          <h2>Messages</h2>
          <button
            className="newMessageBtn"
            onClick={() => setShowNewMessage(!showNewMessage)}
            title="New message"
          >
            <EditIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
        <div className="messagesModeLabel">
  {mode === "business" ? "🏪 Shop DM" : "💬 Personal DM"}
</div>
       {/* {isVendor && mode === "personal" && (
  // <div className="messageTabBar">
  //   <button
  //     className={`messageTab ${activeTab === "personal" ? "active" : ""}`}
  //     onClick={() => {
  //       setActiveTab("personal")
  //       setActiveConvId(null)
  //       setActiveConv(null)
  //       setMessages([])
  //       setConversations([])
  //       setLoading(true)
  //     }}
  //   >
  //     DM
  //   </button>
  //   <button
  //     className={`messageTab ${activeTab === "business" ? "active" : ""}`}
  //     onClick={() => {
  //       setActiveTab("business")
  //       setActiveConvId(null)
  //       setActiveConv(null)
  //       setMessages([])
  //       setConversations([])
  //       setLoading(true)
  //     }}
  //   >
  //     Shop DM
  //   </button>
  // </div>
)} */}
        

        <div className="messagesSearchBar">
          <SearchIcon sx={{ fontSize: 18, color: "var(--text-secondary)" }} />
          <input
            type="text"
            placeholder={
              showNewMessage ? "Search users..." : "Search conversations..."
            }
            value={showNewMessage ? userSearch : search}
            onChange={(e) =>
              showNewMessage
                ? setUserSearch(e.target.value)
                : setSearch(e.target.value)
            }
            className="messagesSearchInput"
          />
          {(search || userSearch) && (
            <button
              className="messagesSearchClear"
              onClick={() => {
                setSearch("");
                setUserSearch("");
                setUserResults([]);
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="conversationsList">
          {/* ── new message user results ── */}
          {showNewMessage && (
            <>
              {userSearching && <p className="messagesStatus">Searching...</p>}
              {!userSearching && userSearch && userResults.length === 0 && (
                <p className="messagesStatus">No users found.</p>
              )}
              {userResults.map((u) => (
                <div
                  key={u.id}
                  className="conversationItem"
                  onClick={() => handleStartConversation(u.id)}
                >
                  <div className="convAvatar">
                    <UserAvatar avatar_url={u.avatar_url} size={48} />
                  </div>
                  <div className="convInfo">
                    <div className="convTopRow">
                      <p className="convName">{u.name}</p>
                    </div>
                    <div className="convBottomRow">
                      <p className="convLastMessage">@{u.username}</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── existing conversations ── */}
          {!showNewMessage && (
            <>
              {/* skeleton while loading */}
              {loading && <ConversationListSkeleton />}

              {!loading && filtered.length === 0 && (
                <div className="messagesEmpty">
                  <ChatOutlinedIcon
                    sx={{ fontSize: 48, color: "var(--accent-mid)" }}
                  />
                  {search ? (
                    <p>
                      No conversations found for "<strong>{search}</strong>"
                    </p>
                  ) : (
                    <p>No conversations yet.</p>
                  )}
                </div>
              )}

              {!loading &&
                filtered.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conversationItem ${conv.unread_count > 0 ? "unread" : ""} ${activeConvId === conv.id ? "active" : ""}`}
                    onClick={() => openConversation(conv)}
                  >
                    <div className="convAvatar">
                      <UserAvatar avatar_url={conv.other_avatar} size={48} />
                      {conv.other_online && (
                        <CircleIcon
                          sx={{
                            fontSize: 12,
                            color: "#17bf63",
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            background: "var(--bg-card)",
                            borderRadius: "50%",
                          }}
                        />
                      )}
                    </div>
                    <div className="convInfo">
                      <div className="convTopRow">
                        <p className="convName">{conv.other_name}</p>
                        <span className="convTime">
                          {conv.last_message_at
                            ? formatTime(conv.last_message_at)
                            : ""}
                        </span>
                      </div>
                      <div className="convBottomRow">
                        <p className="convLastMessage">
                          {conv.last_message || "Say hello!"}
                        </p>
                        {conv.unread_count > 0 && (
                          <span className="convUnreadBadge">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT: chat panel ── */}
      <div
        className={`igRight ${!activeConvId ? "igRightEmpty" : ""} ${activeConvId ? "visible-mobile" : ""}`}
      >
        {!activeConvId ? (
          <div className="igRightPlaceholder">
            <ChatOutlinedIcon
              sx={{ fontSize: 64, color: "var(--accent-mid)" }}
            />
            <p>Select a conversation to start chatting</p>
          </div>
        ) : (
          <div className="conversationPage">
            {/* ── chat header ── */}
            <div className="convHeader">
             <button
  className="backBtn"
  onClick={() => {
    openConvRef.current = null
    openTabRef.current = null
    setActiveConvId(null)
    setActiveConv(null)
    setMessages([])
    refetchRef.current += 1  // ← triggers useEffect to re-run
  }}
>
  <ArrowBackIcon sx={{ fontSize: 20 }} />
</button>

              {/* header: skeleton while loading messages, real info otherwise */}
              {msgLoading && !activeConv ? (
                <div className="convHeaderInfo">
                  <div
                    className="skelCircle shimmer"
                    style={{ width: 38, height: 38 }}
                  />
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 5 }}
                  >
                    <div
                      className="skelLine shimmer"
                      style={{ width: 100, height: 13 }}
                    />
                    <div
                      className="skelLine shimmer"
                      style={{ width: 60, height: 11 }}
                    />
                  </div>
                </div>
              ) : (
                activeConv && (
                  <div className="convHeaderInfo">
                    <div
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      <UserAvatar
                        avatar_url={activeConv.other_avatar}
                        size={38}
                      />
                      {isOnline && (
                        <CircleIcon
                          sx={{
                            fontSize: 11,
                            color: "#17bf63",
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            background: "var(--bg-card)",
                            borderRadius: "50%",
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <p className="convHeaderName">{activeConv.other_name}</p>
                      <p className="convHeaderStatus">
                        {isOnline
                          ? "Online"
                          : activeConv.other_last_seen
                            ? `Last seen ${new Date(
                                activeConv.other_last_seen,
                              ).toLocaleTimeString("en-NG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : "Offline"}
                      </p>
                    </div>
                  </div>
                )
              )}

              <button
                className="convSearchBtn"
                onClick={() => {
                  setShowSearch(!showSearch);
                  setSearchText("");
                  setSearchResults([]);
                }}
              >
                <SearchIcon sx={{ fontSize: 20 }} />
              </button>
            </div>

            {/* ── inline search bar ── */}
            {showSearch && (
              <div className="convSearchBar">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="convSearchInput"
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <span className="convSearchCount">
                    {searchIndex + 1}/{searchResults.length}
                  </span>
                )}
                {searchResults.length > 1 && (
                  <>
                    <button
                      className="convSearchNav"
                      onClick={() => goToResult("up")}
                    >
                      ↑
                    </button>
                    <button
                      className="convSearchNav"
                      onClick={() => goToResult("down")}
                    >
                      ↓
                    </button>
                  </>
                )}
                {searchText && searchResults.length === 0 && (
                  <span className="convSearchCount">No results</span>
                )}
                <button
                  className="convSearchClose"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchText("");
                    setSearchResults([]);
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </button>
              </div>
            )}

            {/* ── messages list: skeleton while loading, real messages otherwise ── */}
            {msgLoading ? (
              <ChatSkeleton />
            ) : (
              <div className="messagesList">
                {messages.map((msg) => {
                  const isMine = msg.sender_id === user.id;
                  const isHighlight = searchResults.some(
                    (r) => r.id === msg.id,
                  );
                  const isCurrent = searchResults[searchIndex]?.id === msg.id;
                  return (
                    <div
                      key={msg.id}
                      ref={(el) => (messageRefs.current[msg.id] = el)}
                      className={`messageBubbleWrapper ${isMine ? "mine" : "theirs"}`}
                    >
                      {!isMine && (
                        <UserAvatar avatar_url={msg.avatar_url} size={28} />
                      )}
                      <div
                        className={`messageBubble ${isMine ? "mine" : "theirs"} ${
                          isCurrent
                            ? "searchCurrent"
                            : isHighlight
                              ? "searchMatch"
                              : ""
                        }`}
                      >
                        <p
                          style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {searchText
                            ? highlight(msg.content, searchText)
                            : msg.content}
                        </p>
                        <span className="messageTime">
                          {new Date(msg.created_at).toLocaleTimeString(
                            "en-NG",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {otherTyping && (
                  <div className="messageBubbleWrapper theirs">
                    <div className="messageBubble theirs typingBubble">
                      <span className="typingDot" />
                      <span className="typingDot" />
                      <span className="typingDot" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* ── input ── */}
            <div className="messageInputRow">
              <textarea
                className="messageInput"
                placeholder="Send message..."
                value={input}
                onChange={handleTyping}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                  // Shift+Enter now inserts a newline naturally
                }}
                rows={1}
              />
              <button
                className="messageSendBtn"
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <SendIcon sx={{ fontSize: 20 }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
