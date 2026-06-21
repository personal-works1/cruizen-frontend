import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined"
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward"
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward"
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined"
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined"
import { useAuth } from "../Context/AuthContext"
import { API_URL } from "../Authentication/Authentication"
import "./WalletHistory.css"

function TransactionIcon({ type }) {
  if (type === "topup")        return <ArrowDownwardIcon sx={{ fontSize: 18, color: "#17bf63" }} />
  if (type === "withdrawal")   return <ArrowUpwardIcon   sx={{ fontSize: 18, color: "#e53935" }} />
  if (type === "purchase")     return <ShoppingBagOutlinedIcon sx={{ fontSize: 18, color: "#61027b" }} />
  if (type === "sale")         return <StorefrontOutlinedIcon  sx={{ fontSize: 18, color: "#f5a623" }} />
  if (type === "refund")       return <ArrowDownwardIcon sx={{ fontSize: 18, color: "#1da1f2" }} />
  // ── transfer types ────────────────────────────────────────────────
  if (type === "transfer_in")  return <ArrowDownwardIcon sx={{ fontSize: 18, color: "#17bf63" }} />
  if (type === "transfer_out") return <ArrowUpwardIcon   sx={{ fontSize: 18, color: "#e53935" }} />
  return null
}

function TransactionLabel({ type }) {
  const labels = {
    topup:        "Wallet Top Up",
    withdrawal:   "Withdrawal",
    purchase:     "Product Purchase",
    sale:         "Sale Received",
    refund:       "Refund",
    transfer_in:  "Money Received",  // ← added
    transfer_out: "Money Sent",      // ← added
  }
  return <span>{labels[type] || type}</span>
}

export default function WalletHistory() {
  const navigate  = useNavigate()
  const [balance,      setBalance]      = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balRes, txRes] = await Promise.all([
          axios.get(`${API_URL}/wallet/balance`),
          axios.get(`${API_URL}/wallet/transactions`),
        ])
        setBalance(balRes.data.balance)
        setTransactions(txRes.data.transactions)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const filtered = filter === "all"
    ? transactions
    : transactions.filter((t) => t.type === filter)

  // ── include transfer_in as money in, transfer_out as money out ────────
const totalIn  = transactions
  .filter((t) => ["topup", "sale", "refund", "transfer_in"].includes(t.type))
  .reduce((sum, t) => sum + Number(t.amount), 0)

const totalOut = transactions
  .filter((t) => ["withdrawal", "purchase", "transfer_out"].includes(t.type))
  .reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="walletPage">

      {/* ── Header ── */}
      <div className="walletPageHeader">
        <button className="backBtn" onClick={() => navigate("/Cart")}>
          <ArrowBackIcon fontSize="small" />
        </button>
        <h2>Wallet</h2>
      </div>

      {/* ── Balance Card ── */}
      <div className="walletBalanceCard">
        <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 36, color: "#fff" }} />
        <div>
          <p className="walletCardLabel">Total Balance</p>
          <p className="walletCardBalance">
            {loading ? "..." : `₦${Number(balance).toLocaleString()}`}
          </p>
        </div>
        <div className="walletStats">
          <div className="walletStat">
            <ArrowDownwardIcon sx={{ fontSize: 14, color: "#17bf63" }} />
            <div>
              <p className="statLabel">Money In</p>
              <p className="statValue">₦{totalIn.toLocaleString()}</p>
            </div>
          </div>
          <div className="walletStat">
            <ArrowUpwardIcon sx={{ fontSize: 14, color: "#ffcdd2" }} />
            <div>
              <p className="statLabel">Money Out</p>
              <p className="statValue">₦{totalOut.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="txFilterTabs">
  {["all", "topup", "withdrawal", "purchase", "sale", "transfer_in", "transfer_out"].map((f) => (
    <button
      key={f}
      className={`txFilterTab ${filter === f ? "active" : ""}`}
      onClick={() => setFilter(f)}
    >
      {f === "all"          ? "All"        :
       f === "topup"        ? "Top Ups"    :
       f === "withdrawal"   ? "Withdrawals":
       f === "purchase"     ? "Purchases"  :
       f === "sale"         ? "Sales"      :
       f === "transfer_in"  ? "Received"   :
       f === "transfer_out" ? "Sent"       : f}
    </button>
  ))}
</div>

      {/* ── Transactions ── */}
      <div className="txList">
        {loading && <p className="txStatus">Loading transactions...</p>}
        {!loading && filtered.length === 0 && (
          <p className="txStatus">No transactions yet.</p>
        )}
        {filtered.map((tx) => (
          <div key={tx.id} className="txItem">
            <div className="txIconWrap">
              <TransactionIcon type={tx.type} />
            </div>
            <div className="txInfo">
              <TransactionLabel type={tx.type} />
              <span className="txDesc">{tx.description}</span>
              <span className="txDate">
                {new Date(tx.created_at).toLocaleDateString("en-NG", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit"
                })}
              </span>
            </div>
            <div className="txRight">
              <p className={`txAmount ${
                ["topup", "sale", "refund"].includes(tx.type) ? "credit" : "debit"
              }`}>
                {["topup", "sale", "refund"].includes(tx.type) ? "+" : "-"}
                ₦{Number(tx.amount).toLocaleString()}
              </p>
              <span className={`txStatus ${tx.status}`}>{tx.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}