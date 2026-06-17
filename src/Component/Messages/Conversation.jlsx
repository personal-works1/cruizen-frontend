import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../Context/AuthContext"
import { useSocket } from "../Context/SocketContext"
import { API_URL } from "../Authentication/Authentication"
import UserAvatar from "../Common/UserAvatar"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import SendIcon from "@mui/icons-material/Send"
import CircleIcon from "@mui/icons-material/Circle"
import SearchIcon from "@mui/icons-material/Search"
import CloseIcon from "@mui/icons-material/Close"
import "./Messages.css"

export default function Conversation() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user, getValidToken } = useAuth()
  const { socket, onlineUsers } = useSocket()

  const [messages,    setMessages]    = useState([])
  const [conv,        setConv]        = useState(null)
  const [input,       setInput]       = useState("")
  const [loading,     setLoading]     = useState(true)
  const [otherTyping, setOtherTyping] = useState(false)

  // ── message search state ──────────────────────────────────────────────
  const [showSearch,    setShowSearch]    = useState(false)
  const [searchText,    setSearchText]    = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searchIndex,   setSearchIndex]   = useState(0)

  const messagesEndRef   = useRef(null)
  const typingTimeoutRef = useRef(null)
  const messageRefs      = useRef({}) // ← ref map for scrolling to specific messages

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getValidToken()
        const authHeader = { Authorization: `Bearer ${token}` }
        const [msgRes, convRes] = await Promise.all([
          axios.get(`${API_URL}/messages/conversations/${id}/messages`, { headers: authHeader }),
          axios.get(`${API_URL}/messages/conversations`, { headers: authHeader })
        ])
        setMessages(msgRes.data.messages)
        const thisConv = convRes.data.conversations.find(c => c.id === id)
        setConv(thisConv)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  // socket setup
  useEffect(() => {
    if (!socket) return
    socket.emit("join_conversation", id)
    socket.on("new_message", (message) => {
      setMessages(prev => [...prev, message])
    })
    socket.on("user_typing", ({ userId }) => {
      if (userId !== user.id) setOtherTyping(true)
    })
    socket.on("user_stop_typing", ({ userId }) => {
      if (userId !== user.id) setOtherTyping(false)
    })
    return () => {
      socket.off("new_message")
      socket.off("user_typing")
      socket.off("user_stop_typing")
    }
  }, [socket, id])

  // scroll to bottom on new messages
  useEffect(() => {
    if (!showSearch) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // ── search messages locally ───────────────────────────────────────────
  // filters messages by content text, no API call needed
  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([])
      setSearchIndex(0)
      return
    }
    const q       = searchText.toLowerCase()
    const results = messages
      .map((msg, index) => ({ ...msg, index }))
      .filter(msg => msg.content?.toLowerCase().includes(q))
    setSearchResults(results)
    setSearchIndex(0)

    // scroll to first result
    if (results.length > 0) {
      messageRefs.current[results[0].id]?.scrollIntoView({
        behavior: "smooth", block: "center"
      })
    }
  }, [searchText, messages])

  // ── navigate between search results ──────────────────────────────────
  const goToResult = (direction) => {
    const next = direction === "up"
      ? Math.max(0, searchIndex - 1)
      : Math.min(searchResults.length - 1, searchIndex + 1)
    setSearchIndex(next)
    messageRefs.current[searchResults[next].id]?.scrollIntoView({
      behavior: "smooth", block: "center"
    })
  }

  const handleSend = () => {
    if (!input.trim() || !socket) return
    socket.emit("send_message", {
      conversation_id: id,
      sender_id:       user.id,
      content:         input.trim()
    })
    setInput("")
    socket.emit("stop_typing", { conversation_id: id, userId: user.id })
  }

  const handleTyping = (e) => {
    setInput(e.target.value)
    if (!socket) return
    socket.emit("typing", { conversation_id: id, userId: user.id, username: user.username })
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { conversation_id: id, userId: user.id })
    }, 1500)
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-NG", {
      hour: "2-digit", minute: "2-digit"
    })
  }

  // ── highlight matched text in message ────────────────────────────────
  const highlight = (text, query) => {
    if (!query.trim()) return text
    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} style={{ background: "#f5e6ff", color: "#61027b", borderRadius: "2px" }}>{part}</mark>
        : part
    )
  }

  const isOnline = conv && onlineUsers.has(conv.other_user_id)

  if (loading) return (
    <div className="conversationPage">
      <p style={{ textAlign: "center", padding: "2rem", color: "#61027b" }}>Loading...</p>
    </div>
  )

  return (
    <div className="conversationPage">

      {/* ── Header ── */}
      <div className="convHeader">
        <button className="backBtn" onClick={() => navigate("/messages")}>
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </button>
        {conv && (
          <div className="convHeaderInfo">
            <div style={{ position: "relative", display: "inline-block" }}>
              <UserAvatar avatar_url={conv.other_avatar} size={38} />
              {isOnline && (
                <CircleIcon sx={{
                  fontSize: 11, color: "#17bf63",
                  position: "absolute", bottom: 0, right: 0,
                  background: "#fff", borderRadius: "50%"
                }} />
              )}
            </div>
            <div>
              <p className="convHeaderName">{conv.other_name}</p>
              <p className="convHeaderStatus">
                {isOnline ? "Online" : conv.other_last_seen
                  ? `Last seen ${new Date(conv.other_last_seen).toLocaleTimeString("en-NG", {
                      hour: "2-digit", minute: "2-digit"
                    })}`
                  : "Offline"
                }
              </p>
            </div>
          </div>
        )}

        {/* ── search toggle button ── */}
        <button
          className="convSearchBtn"
          onClick={() => {
            setShowSearch(!showSearch)
            setSearchText("")
            setSearchResults([])
          }}
          title="Search messages"
        >
          <SearchIcon sx={{ fontSize: 20 }} />
        </button>
      </div>

      {/* ── inline search bar — slides in when toggled ── */}
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
          {/* ── result count + navigation ── */}
          {searchResults.length > 0 && (
            <span className="convSearchCount">
              {searchIndex + 1}/{searchResults.length}
            </span>
          )}
          {searchResults.length > 1 && (
            <>
              <button className="convSearchNav" onClick={() => goToResult("up")}>↑</button>
              <button className="convSearchNav" onClick={() => goToResult("down")}>↓</button>
            </>
          )}
          {searchText && searchResults.length === 0 && (
            <span className="convSearchCount">No results</span>
          )}
          <button className="convSearchClose" onClick={() => {
            setShowSearch(false)
            setSearchText("")
            setSearchResults([])
          }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </button>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="messagesList">
        {messages.map((msg) => {
          const isMine      = msg.sender_id === user.id
          const isHighlight = searchResults.some(r => r.id === msg.id)
          const isCurrent   = searchResults[searchIndex]?.id === msg.id

          return (
            <div
              key={msg.id}
              ref={el => messageRefs.current[msg.id] = el} // ← ref for scroll targeting
              className={`messageBubbleWrapper ${isMine ? "mine" : "theirs"}`}
            >
              {!isMine && <UserAvatar avatar_url={msg.avatar_url} size={28} />}
              <div className={`messageBubble ${isMine ? "mine" : "theirs"} ${
                // ── highlight current search result with a border ──
                isCurrent ? "searchCurrent" : isHighlight ? "searchMatch" : ""
              }`}>
                <p>
                  {/* ── highlight matched text inside message ── */}
                  {searchText ? highlight(msg.content, searchText) : msg.content}
                </p>
                <span className="messageTime">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          )
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

      {/* ── Input ── */}
      <div className="messageInputRow">
        <input
          className="messageInput"
          placeholder="Type a message..."
          value={input}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
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
  )
}