import Home from "./Component/Home/Home";
import Cart from "./Component/Cart/Cart";
import Profile from "./Component/Profile/Profile";
import Search from "./Component/Search/Search";
import NavBar from "./Component/NavBar/Navbar";
import Auth from "./Component/Authentication/Authentication";
import ProtectedRoute from "./Component/Protected";
import Bookmarks from "./Component/Home/BookMarks/BookMark";
import Notifications from "./Component/Notify/Notification";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import WalletHistory from "./Component/Cart/WalletHistory";
import OrderDetailPage from "./Component/Cart/OrderDetailPage";
import ProductDetail from "./Component/Cart/ProductDetail";
import SettingsTab from "./Component/Profile/Settings";
import Messages from "./Component/Messages/Messages";
// import Conversation from "./Component/Messages/Conversation";
import PostDetailPage from "./Component/Post/PostDetailPage";
import ShopPage from "./Component/Shop/ShopPage";
import Leaderboard from "./Component/Leaderboard/Leaderboard";
import HallOfFame from "./Component/Leaderboard/HallOfFame";
import ForgotPassword from "./Component/Authentication/ForgotPassword";
import VerifyEmail from "./Component/Authentication/VerifyEmail";
import Reels from "./Component/Search/Reels"

function Layout() {
  const location = useLocation();
  const hideNav = location.pathname === "/usersignIn" ||
                location.pathname === "/forgot-password" ||
                location.pathname === "/verify-email" ||
                location.pathname.startsWith("/product") ||
                location.pathname.startsWith("/reels") 
                

  return (
    <>
      {!hideNav && <NavBar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/usersignIn" element={<Auth />} />
        <Route path="/search" element={<Search />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />
        <Route path="/shop/:slug" element={<ShopPage />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reels/:postId" element={<Reels />} />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route path="/leaderboard/hall-of-fame" element={<HallOfFame />} />
        <Route
          path="/Cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Cart"
          element={
            <ProtectedRoute>
              <Route path="/bookmarks" element={<Bookmarks />} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            // <ProtectedRoute>
            <Profile />
            // </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <WalletHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsTab />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        {/* <Route
          path="/messages/:id"
          element={
            <ProtectedRoute>
              <Conversation />
            </ProtectedRoute>
          }
        /> */}
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
