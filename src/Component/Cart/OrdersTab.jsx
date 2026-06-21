import React, { useState, useEffect } from 'react'
import axios from 'axios'
import "./Cart.css"
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../Context/AuthContext'
import { API_URL } from '../Authentication/Authentication'
import UserAvatar from '../Common/UserAvatar'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import { OrdersTabSkeleton } from './Cart'

const STATUS_CONFIG = {
  paid:      { label: 'Awaiting Delivery', color: '#f5a623', icon: <AccessTimeIcon sx={{ fontSize: 14 }} /> },
  delivered: { label: 'Delivered',         color: '#17bf63', icon: <LocalShippingOutlinedIcon sx={{ fontSize: 14 }} /> },
  completed: { label: 'Completed',         color: '#61027b', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
}

function OrderCard({ order, type }) {
  const navigate = useNavigate()
  const status   = STATUS_CONFIG[order.status] || STATUS_CONFIG.paid
  const isSale   = type === 'sales'

  return (
    <div className="orderCard" onClick={() => navigate(`/order/${order.id}`)}>
      <div className="orderCardLeft">
        <div className="orderProductImage">
          {order.image_url
            ? <img src={order.image_url} alt={order.product_name} />
            : <div className="orderImagePlaceholder" />
          }
        </div>
        <div className="orderCardInfo">
          <p className="orderProductName">{order.product_name}</p>
          <p className="orderMeta">
            {isSale ? `Buyer: @${order.buyer_username}` : `Seller: @${order.seller_username}`}
          </p>
          <p className="orderMeta">Qty: {order.quantity} · ₦{Number(order.amount).toLocaleString()}</p>
          <p className="orderDate">{new Date(order.created_at).toLocaleDateString('en-NG', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}</p>
        </div>
      </div>
      <div className="orderCardRight">
        <span className="orderStatusBadge" style={{ background: status.color + '20', color: status.color }}>
          {status.icon} {status.label}
        </span>
      </div>
    </div>
  )
}

export default function OrdersTab() {
  const {  user } = useAuth()
  const [view,    setView]    = useState('purchases')
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  const isVendor = user?.role === 'vendor' || user?.role === 'both'

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const endpoint = view === 'purchases'
          ? `${API_URL}/orders/my/purchases`
          : `${API_URL}/orders/my/sales`
        const res = await axios.get(endpoint)
        setOrders(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [view])

  return (
    <div className="ordersTab">
      {/* Toggle */}
      <div className="ordersToggle">
        <button
          className={`ordersToggleBtn ${view === 'purchases' ? 'active' : ''}`}
          onClick={() => setView('purchases')}
        >
          <ShoppingBagOutlinedIcon sx={{ fontSize: 16 }} /> My Purchases
        </button>
        {isVendor && (
          <button
            className={`ordersToggleBtn ${view === 'sales' ? 'active' : ''}`}
            onClick={() => setView('sales')}
          >
            <StorefrontOutlinedIcon sx={{ fontSize: 16 }} /> My Sales
          </button>
        )}
      </div>

      {/* List: skeleton while loading */}
      {loading ? (
        // reuse the skeleton from Cart but skip the toggle row (already rendered above)
        <div className="ordersList">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="orderCard" style={{ cursor: "default", pointerEvents: "none" }}>
              <div className="orderCardLeft">
                <div className="skelLine shimmer"
                  style={{ width: 60, height: 60, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <div className="skelLine shimmer" style={{ width: "70%", height: 13 }} />
                  <div className="skelLine shimmer" style={{ width: "50%", height: 11 }} />
                  <div className="skelLine shimmer" style={{ width: "60%", height: 11 }} />
                  <div className="skelLine shimmer" style={{ width: "35%", height: 10 }} />
                </div>
              </div>
              <div className="skelLine shimmer"
                style={{ width: 90, height: 26, borderRadius: 20, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="ordersEmptyState">
          <ShoppingBagOutlinedIcon sx={{ fontSize: 48, color: '#e2a9f1' }} />
          <p>{view === 'purchases' ? "You haven't bought anything yet." : "No sales yet."}</p>
        </div>
      ) : (
        <div className="ordersList">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} type={view} />
          ))}
        </div>
      )}
    </div>
  )
}
