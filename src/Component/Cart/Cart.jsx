import React, { useState, useEffect, useRef } from "react";
import "./Cart.css";
import axios from "axios";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AddIcon from "@mui/icons-material/Add";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { useMode } from "../Context/modeContext";
import { API_URL } from "../Authentication/Authentication";
import UserAvatar from "../Common/UserAvatar";
import OrdersTab from "./OrdersTab";

const CATEGORIES = [
  "All",
  "Lodges",
  "Fashion",
  "Watches",
  "Men's Wear",
  "Phone Accessories",
  "Electronics",
  "Beauty & Skincare",
  "Food & Drinks",
  "Books",
];
const MAIN_TABS = ["Shop", "Orders"];

// ── Skeleton components ───────────────────────────────────────────────────────
function WalletBannerSkeleton() {
  return (
    <div className="walletBanner">
      <div className="walletLeft">
        <div className="skelCircle shimmer" style={{ width: 40, height: 40 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="skelLine shimmer" style={{ width: 90, height: 11 }} />
          <div
            className="skelLine shimmer"
            style={{ width: 120, height: 22 }}
          />
        </div>
      </div>
      <div className="walletRight" style={{ gap: 8 }}>
        {[80, 80, 80, 36].map((w, i) => (
          <div
            key={i}
            className="skelLine shimmer"
            style={{ width: w, height: 36, borderRadius: 8 }}
          />
        ))}
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div
      className="cartCard"
      style={{ cursor: "default", pointerEvents: "none" }}
    >
      {/* owner row */}
      <div className="cartOwner" style={{ marginBottom: "0.5em" }}>
        <div
          className="skelCircle shimmer"
          style={{ width: 40, height: 40, flexShrink: 0 }}
        />
        <div
          style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}
        >
          <div
            className="skelLine shimmer"
            style={{ width: "80%", height: 12 }}
          />
          <div
            className="skelLine shimmer"
            style={{ width: "50%", height: 11 }}
          />
        </div>
      </div>
      {/* image */}
      <div className="goodsImage shimmer" style={{ borderRadius: 8 }} />
      {/* info */}
      <div className="goodsInfo" style={{ gap: 6 }}>
        <div
          className="skelLine shimmer"
          style={{ width: "90%", height: 13 }}
        />
        <div
          className="skelLine shimmer"
          style={{ width: "55%", height: 16 }}
        />
        <div
          className="skelLine shimmer"
          style={{ width: "40%", height: 11 }}
        />
      </div>
    </div>
  );
}

function CategoryRowSkeleton() {
  return (
    <div className="categorySection">
      <div
        className="skelLine shimmer"
        style={{ width: 120, height: 18, marginLeft: 4 }}
      />
      <div className="shoppingRoll">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function OrderCardSkeleton() {
  return (
    <div
      className="orderCard"
      style={{ cursor: "default", pointerEvents: "none" }}
    >
      <div className="orderCardLeft">
        <div
          className="skelLine shimmer"
          style={{ width: 60, height: 60, borderRadius: 8, flexShrink: 0 }}
        />
        <div
          style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}
        >
          <div
            className="skelLine shimmer"
            style={{ width: "70%", height: 13 }}
          />
          <div
            className="skelLine shimmer"
            style={{ width: "50%", height: 11 }}
          />
          <div
            className="skelLine shimmer"
            style={{ width: "60%", height: 11 }}
          />
          <div
            className="skelLine shimmer"
            style={{ width: "35%", height: 10 }}
          />
        </div>
      </div>
      <div
        className="skelLine shimmer"
        style={{ width: 90, height: 26, borderRadius: 20, flexShrink: 0 }}
      />
    </div>
  );
}

// Export so OrdersTab can use it too
export function OrdersTabSkeleton() {
  return (
    <div className="ordersTab">
      <div className="ordersToggle">
        <div
          className="skelLine shimmer"
          style={{ flex: 1, height: 40, borderRadius: 8 }}
        />
        <div
          className="skelLine shimmer"
          style={{ flex: 1, height: 40, borderRadius: 8 }}
        />
      </div>
      <div className="ordersList">
        {Array.from({ length: 4 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ── Top Up Modal ──────────────────────────────────────────────────────────────
function TopUpModal({ onClose, onSuccess, userEmail }) {
  const { token } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTopUp = async () => {
    if (!amount || Number(amount) < 100) {
      setError("Minimum top up is ₦100");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${API_URL}/wallet/topup/initialize`,
        { amount: Number(amount), email: userEmail },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      window.location.href = res.data.authorization_url;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to initialize payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modalOverlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modalBox">
        <div className="modalTopRow">
          <h2>Top Up Wallet</h2>
          <button className="modalCloseBtn" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>
        <div className="field">
          <label>Amount (₦)</label>
          <input
            type="number"
            placeholder="Enter amount e.g. 5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="100"
          />
        </div>
        <div className="quickAmounts">
          {[500, 1000, 2000, 5000].map((a) => (
            <button
              key={a}
              className="quickAmountBtn"
              onClick={() => setAmount(String(a))}
            >
              ₦{a.toLocaleString()}
            </button>
          ))}
        </div>
        {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}
        <div className="modalBtns">
          <button className="cancelBtn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="submitBtn"
            onClick={handleTopUp}
            disabled={loading}
          >
            {loading ? "Processing..." : "Pay with Paystack"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Withdraw Modal ────────────────────────────────────────────────────────────
function WithdrawModal({ onClose, balance }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    amount: "",
    bank_code: "",
    account_number: "",
    account_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleWithdraw = async () => {
    if (!form.amount || Number(form.amount) < 100) {
      setError("Minimum withdrawal is ₦100");
      return;
    }
    if (Number(form.amount) > balance) {
      setError("Insufficient balance");
      return;
    }
    if (!form.bank_code || !form.account_number || !form.account_name) {
      setError("Please fill all bank details");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.post(
        `${API_URL}/wallet/withdraw`,
        {
          ...form,
          amount: Number(form.amount),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuccess("Withdrawal successful! Funds will arrive shortly.");
    } catch (err) {
      setError(err.response?.data?.error || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  const banks = [
    { code: "044", name: "Access Bank" },
    { code: "014", name: "Afribank" },
    { code: "023", name: "Citibank" },
    { code: "063", name: "Diamond Bank" },
    { code: "050", name: "EcoBank" },
    { code: "084", name: "Enterprise Bank" },
    { code: "070", name: "Fidelity Bank" },
    { code: "011", name: "First Bank" },
    { code: "214", name: "First City Monument Bank" },
    { code: "058", name: "GTBank" },
    { code: "030", name: "Heritage Bank" },
    { code: "301", name: "Jaiz Bank" },
    { code: "082", name: "Keystone Bank" },
    { code: "526", name: "Moniepoint" },
    { code: "076", name: "Polaris Bank" },
    { code: "101", name: "Providus Bank" },
    { code: "221", name: "Stanbic IBTC" },
    { code: "068", name: "Standard Chartered" },
    { code: "232", name: "Sterling Bank" },
    { code: "100", name: "Suntrust Bank" },
    { code: "032", name: "Union Bank" },
    { code: "033", name: "UBA" },
    { code: "215", name: "Unity Bank" },
    { code: "035", name: "Wema Bank" },
    { code: "057", name: "Zenith Bank" },
    { code: "627", name: "Kuda Bank" },
    { code: "565", name: "Carbon" },
    { code: "090405", name: "Opay" },
    { code: "999991", name: "PalmPay" },
  ];

  return (
    <div
      className="modalOverlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modalBox">
        <div className="modalTopRow">
          <h2>Withdraw Funds</h2>
          <button className="modalCloseBtn" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>
        {success ? (
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <p style={{ color: "#17bf63", fontWeight: 600 }}>{success}</p>
            <button
              className="submitBtn"
              style={{ marginTop: "1rem" }}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="field">
              <label>Amount (₦)</label>
              <input
                type="number"
                name="amount"
                placeholder="Enter amount"
                value={form.amount}
                onChange={handleChange}
                min="100"
              />
              <p style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
                Available: ₦{Number(balance).toLocaleString()}
              </p>
            </div>
            <div className="field">
              <label>Bank</label>
              <select
                name="bank_code"
                value={form.bank_code}
                onChange={handleChange}
              >
                <option value="">Select Bank</option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Account Number</label>
              <input
                type="text"
                name="account_number"
                placeholder="10-digit account number"
                value={form.account_number}
                onChange={handleChange}
                maxLength={10}
              />
            </div>
            <div className="field">
              <label>Account Name</label>
              <input
                type="text"
                name="account_name"
                placeholder="Account holder name"
                value={form.account_name}
                onChange={handleChange}
              />
            </div>
            {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}
            <div className="modalBtns">
              <button className="cancelBtn" onClick={onClose}>
                Cancel
              </button>
              <button
                className="submitBtn"
                onClick={handleWithdraw}
                disabled={loading}
              >
                {loading ? "Processing..." : "Withdraw"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Transfer Modal ────────────────────────────────────────────────────────────
function TransferModal({ onClose, balance, onSuccess }) {
  const { getValidToken } = useAuth();
  const [form, setForm] = useState({
    recipient_username: "",
    amount: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleTransfer = async () => {
    if (!form.recipient_username.trim()) {
      setError("Enter a username");
      return;
    }
    if (!form.amount || Number(form.amount) < 50) {
      setError("Minimum transfer is ₦50");
      return;
    }
    if (Number(form.amount) > balance) {
      setError("Insufficient balance");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await getValidToken();
      await axios.post(
        `${API_URL}/wallet/transfer`,
        {
          recipient_username: form.recipient_username.replace("@", "").trim(),
          amount: Number(form.amount),
          note: form.note,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuccess(
        `₦${Number(form.amount).toLocaleString()} sent to @${form.recipient_username} successfully!`,
      );
      onSuccess(Number(form.amount));
    } catch (err) {
      setError(err.response?.data?.error || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modalOverlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modalBox">
        <div className="modalTopRow">
          <h2>Send Money</h2>
          <button className="modalCloseBtn" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>
        {success ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <p style={{ fontSize: "2rem" }}>✅</p>
            <p
              style={{
                color: "#17bf63",
                fontWeight: 600,
                marginBottom: "1rem",
              }}
            >
              {success}
            </p>
            <button className="submitBtn" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="field">
              <label>Recipient Username</label>
              <input
                name="recipient_username"
                value={form.recipient_username}
                onChange={handleChange}
                placeholder="@username"
              />
            </div>
            <div className="field">
              <label>Amount (₦)</label>
              <input
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                placeholder="Enter amount e.g. 500"
                min="50"
              />
              <p style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
                Available: ₦{Number(balance).toLocaleString()}
              </p>
            </div>
            <div className="quickAmounts">
              {[100, 500, 1000, 2000].map((a) => (
                <button
                  key={a}
                  className="quickAmountBtn"
                  onClick={() => setForm({ ...form, amount: String(a) })}
                >
                  ₦{a.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="field">
              <label>
                Note <span className="optional">(optional)</span>
              </label>
              <input
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="e.g. Miscellaneous"
              />
            </div>
            {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}
            <div className="modalBtns">
              <button className="cancelBtn" onClick={onClose}>
                Cancel
              </button>
              <button
                className="submitBtn"
                onClick={handleTransfer}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Money"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onDeleted }) {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef();
  const shopSlug = product.business_name?.toLowerCase().replace(/ /g, "-");
  const isOwner = user?.id === product.vendor_id;

  // close menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this product?")) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDeleted(product);
      setMenuOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };


  return (
    <div
      className="cartCard"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="cartOwnerCartPage" style={{ position: "relative" }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/shop/${shopSlug}`);
          }}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
          }}
        >
          <UserAvatar avatar_url={product.display_avatar_url} size={40} variant="vendor" />
          <div className="UserandRatings">
          <p>{product.business_name}</p>
            <p className="productRating">
              <StarIcon sx={{ fontSize: 14, color: "#f5a623" }} />
              {product.avg_rating
                ? Number(product.avg_rating).toFixed(1)
                : "New"}
            </p>
          </div>
        </div>

        {/* 3-dot menu — owner only */}
        {isOwner && (
          <div
            ref={menuRef}
            style={{ position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                color: "var(--text-secondary)",
                padding: "4px 6px",
                lineHeight: 1,
                borderRadius: 6,
              }}
            >
              ⋮
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "110%",
                  zIndex: 9999,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                  minWidth: 150,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#e53935",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  🗑️ {deleting ? "Deleting..." : "Delete product"}
                </button>
                <button
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  ✏️ Edit product
                </button>
                <button
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  👁️ Toggle visibility
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="goodsImage">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "0.5em",
            }}
          />
        )}
      </div>
      <div className="goodsInfo">
        <p className="about">{product.name}</p>
        <p className="Price">₦{Number(product.price).toLocaleString()}</p>
        {product.fake_price && (
          <p className="fakePrice">
            ₦{Number(product.fake_price).toLocaleString()}
          </p>
        )}
        <p className="UnitLeft">{product.units_left} units left</p>
      </div>
    </div>
  );
}

function CategoryRow({ category, products, onDeleted }) {
  if (!products || products.length === 0) return null;
  return (
    <div className="categorySection">
      <h2 className="categoryTitle">{category}</h2>
      <div className="shoppingRoll">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onDeleted={onDeleted} />
        ))}
      </div>
    </div>
  );
}

// ── Upload Product Modal ──────────────────────────────────────────────────────
const PRODUCT_CATEGORIES = [
  "Lodges",
  "Fashion",
  "Watches",
  "Men's Wear",
  "Phone Accessories",
  "Electronics",
  "Beauty & Skincare",
  "Food & Drinks",
  "Books",
  "Other",
];

function UploadProductModal({ onClose, onUploaded }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    fake_price: "",
    category: "",
    units_left: "",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("Only JPG, PNG, WEBP and GIF images are allowed");
      fileRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      fileRef.current.value = "";
      return;
    }
    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.category) {
      setError("Name, price and category are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });
      if (image) formData.append("image", image);
      const res = await axios.post(`${API_URL}/products/create`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      onUploaded(res.data.product);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modalOverlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modalBox"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="modalTopRow">
          <h2>Upload Product</h2>
          <button className="modalCloseBtn" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>
        <div className="field">
          <label>Product Image</label>
          <div
            onClick={() => fileRef.current.click()}
            style={{
              width: "100%",
              height: "160px",
              border: "2px dashed #e2a9f1",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              overflow: "hidden",
              background: "#f5e6ff",
            }}
          >
            {preview ? (
              <img
                src={preview}
                alt="preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ textAlign: "center", color: "#61027b" }}>
                <AddAPhotoIcon sx={{ fontSize: 32 }} />
                <p style={{ fontSize: "13px", margin: "4px 0 0" }}>
                  Tap to add photo
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImage}
          />
        </div>
        <div className="field">
          <label>Product Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Nike Air Force 1"
          />
        </div>
        <div className="field">
          <label>
            Description <span className="optional">(optional)</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe your product..."
            rows={3}
            style={{
              padding: "0.7rem 0.9rem",
              border: "1.5px solid #e2a9f1",
              borderRadius: "8px",
              fontSize: "0.95rem",
              color: "#2d002d",
              outline: "none",
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.8rem",
          }}
        >
          <div className="field">
            <label>Price (₦)</label>
            <input
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              placeholder="5000"
              min="1"
            />
          </div>
          <div className="field">
            <label>
              Slashed Price <span className="optional">(optional)</span>
            </label>
            <input
              name="fake_price"
              type="number"
              value={form.fake_price}
              onChange={handleChange}
              placeholder="7000"
            />
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.8rem",
          }}
        >
          <div className="field">
            <label>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              <option value="">Select category</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Units Available</label>
            <input
              name="units_left"
              type="number"
              value={form.units_left}
              onChange={handleChange}
              placeholder="10"
              min="0"
            />
          </div>
        </div>
        {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}
        <div className="modalBtns">
          <button className="cancelBtn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="submitBtn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Cart ─────────────────────────────────────────────────────────────────
const Cart = () => {
  const { token, user, getValidToken } = useAuth();
  const navigate = useNavigate();
  const authHeader = { Authorization: `Bearer ${token}` };
  const { mode } = useMode();

  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [products, setProducts] = useState({});
  const [productsLoading, setProductsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mainTab, setMainTab] = useState("Shop");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const searchDebounce = useRef(null);

  // fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await axios.get(`${API_URL}/wallet/balance`, {
          headers: authHeader,
        });
        setBalance(res.data.balance);
      } catch (err) {
        console.error(err);
      } finally {
        setBalanceLoading(false);
      }
    };
    fetchBalance();
  }, []);

  // fetch products grouped by category
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const cached = sessionStorage.getItem("products_cache");
        if (cached) {
          setProducts(JSON.parse(cached));
          setProductsLoading(false);
          return;
        }
        const res = await axios.get(`${API_URL}/products`, {
          headers: authHeader,
        });
        setProducts(res.data.products);
        sessionStorage.setItem(
          "products_cache",
          JSON.stringify(res.data.products),
        );
      } catch (err) {
        console.error(err);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // check if returning from Paystack
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");
    if (reference) {
      axios
        .get(`${API_URL}/wallet/topup/verify?reference=${reference}`, {
          headers: authHeader,
        })
        .then((res) => {
          setBalance((prev) => prev + res.data.amount);
          window.history.replaceState({}, "", window.location.pathname);
        })
        .catch(console.error);
    }
  }, []);

  // product search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const freshToken = await getValidToken();
        const res = await axios.get(
          `${API_URL}/products/search?q=${searchQuery}`,
          { headers: { Authorization: `Bearer ${freshToken}` } },
        );
        setSearchResults(res.data);
      } catch (err) {
        console.error("Search error:", err.response?.data || err.message);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [searchQuery]);

  const handleProductDeleted = (deleted) => {
    setProducts((prev) => {
      const updated = { ...prev };
      updated[deleted.category] = updated[deleted.category].filter(
        (p) => p.id !== deleted.id,
      );
      sessionStorage.setItem("products_cache", JSON.stringify(updated));
      return updated;
    });
  };

  const filteredProducts =
    activeCategory === "All"
      ? products
      : { [activeCategory]: products[activeCategory] };

  const isVendorMode =
    (user?.role === "vendor" || user?.role === "both") && mode === "business";

  return (
    <div className="cartMain">
      {/* ── Wallet Banner: skeleton while balance loading ── */}
      {balanceLoading ? (
        <WalletBannerSkeleton />
      ) : (
        <div className="walletBanner">
          <div className="walletLeft">
            <AccountBalanceWalletOutlinedIcon
              sx={{ fontSize: 28, color: "#61027b" }}
            />
            <div className="walletInfo">
              <p className="walletLabel">Wallet Balance</p>
              <p className="walletBalance">
                ₦{Number(balance).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="walletRight">
            <button
              className="walletBtn topUpBtn"
              onClick={() => setShowTopUp(true)}
            >
              <AddIcon sx={{ fontSize: 16 }} /> Top Up
            </button>
            <button
              className="walletBtn withdrawBtn"
              onClick={() => setShowWithdraw(true)}
            >
              Withdraw
            </button>
            <button
              className="walletBtn transferBtn"
              onClick={() => setShowTransfer(true)}
            >
              Transfer
            </button>
            <button
              className="walletBtn historyBtn"
              onClick={() => navigate("/wallet")}
            >
              <HistoryIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      )}

      {/* ── Search Bar ── */}
      <div className="search-wrapper">
        <div className="search-bar-row">
          <input
            type="text"
            placeholder="Search products or shops..."
            className="main-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="category-toggle"
              onClick={() => {
                setSearchQuery("");
                setSearchResults(null);
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Main Tabs ── */}
      <div className="mainTabs">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab}
            className={`categoryTab ${mainTab === tab ? "active" : ""}`}
            onClick={() => setMainTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Category Tabs (Shop only, hidden during search) ── */}
      {mainTab === "Shop" && !searchResults && (
        <div className="categoryTabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`categoryTab ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {mainTab === "Orders" ? (
        <OrdersTab />
      ) : searchResults !== null ? (
        // ── search results ────────────────────────────────────────────
        <div style={{ padding: "1rem" }}>
          {searching && (
            <p
              style={{
                textAlign: "center",
                color: "var(--accent)",
                padding: "1rem",
              }}
            >
              Searching...
            </p>
          )}
          {searchResults.vendors?.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  color: "var(--accent)",
                  fontSize: "14px",
                  marginBottom: "0.8rem",
                }}
              >
                🏪 Shops ({searchResults.vendors.length})
              </h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {searchResults.vendors.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => navigate(`/shop/${v.slug}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      background: "var(--bg-card)",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <UserAvatar avatar_url={v.avatar_url} size={48} />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          margin: 0,
                        }}
                      >
                        {v.business_name}
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          margin: 0,
                        }}
                      >
                        {v.business_category} · {v.product_count} products ·{" "}
                        {v.followers_count} followers
                      </p>
                    </div>
                    <span
                      style={{
                        color: "var(--accent)",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      Visit →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {searchResults.products?.length > 0 && (
            <div>
              <h3
                style={{
                  color: "var(--accent)",
                  fontSize: "14px",
                  marginBottom: "0.8rem",
                }}
              >
                📦 Products ({searchResults.products.length})
              </h3>
              <div className="shoppingRoll">
                {searchResults.products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onDeleted={handleProductDeleted}
                  />
                ))}
              </div>
            </div>
          )}
          {!searching &&
            searchResults.products?.length === 0 &&
            searchResults.vendors?.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: "var(--text-secondary)",
                }}
              >
                <p>
                  No results for "<strong>{searchQuery}</strong>"
                </p>
                <p style={{ fontSize: "13px" }}>
                  Try a different product name or shop name
                </p>
              </div>
            )}
        </div>
      ) : (
        // ── product grid: skeleton rows while loading ─────────────────
        <>
          {productsLoading ? (
            // 2 skeleton category rows
            <>
              <CategoryRowSkeleton />
              <CategoryRowSkeleton />
            </>
          ) : Object.keys(filteredProducts).length === 0 ? (
            <p style={{ textAlign: "center", color: "#888", padding: "2rem" }}>
              No products yet.
            </p>
          ) : (
            Object.entries(filteredProducts).map(([category, items]) => (
              <CategoryRow
                key={category}
                category={category}
                products={items}
                onDeleted={handleProductDeleted}
              />
            ))
          )}
        </>
      )}

      {/* ── FAB Upload (vendors only) ── */}
      {isVendorMode && (
        <button
          className="fab-create"
          onClick={() => setShowUpload(true)}
          title="Upload Product"
          style={{ background: "#61027b" }}
        >
          <AddIcon />
        </button>
      )}

      {/* ── Modals ── */}
      {showUpload && (
        <UploadProductModal
          onClose={() => setShowUpload(false)}
          onUploaded={(product) => {
            setProducts((prev) => {
              const updated = {
                ...prev,
                [product.category]: [
                  product,
                  ...(prev[product.category] || []),
                ],
              };
              sessionStorage.setItem("products_cache", JSON.stringify(updated));
              return updated;
            });
          }}
        />
      )}
      {showTopUp && (
        <TopUpModal
          onClose={() => setShowTopUp(false)}
          onSuccess={(amount) => {
            setBalance((prev) => prev + amount);
            setShowTopUp(false);
          }}
          userEmail={user?.email}
        />
      )}
      {showWithdraw && (
        <WithdrawModal
          onClose={() => setShowWithdraw(false)}
          balance={balance}
        />
      )}
      {showTransfer && (
        <TransferModal
          onClose={() => setShowTransfer(false)}
          balance={balance}
          onSuccess={(amount) => {
            setBalance((prev) => prev - amount);
            setShowTransfer(false);
          }}
        />
      )}
    </div>
  );
};

export default Cart;
