import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Notifications from "./pages/Notifications";
import Feed from "./pages/Feed";
import Home from "./pages/Home";
import CreateStory from "./pages/CreateStory";
import Flow from "./pages/Flow";
import Profile from "./pages/Profile";
import VideoPage from "./pages/VideoPage";
import EditProfile from "./pages/EditProfile";
import Explore from "./pages/Explore";
import NotificationBell from "./components/NotificationBell";
import { startNotificationHub } from "./api/notificationHub";
import { useAuth } from "./context/AuthContext";
import FollowersPage from "./pages/FollowersPage";
import FollowingPage from "./pages/FollowingPage";
import { FlowProvider } from "./context/FlowContext";

/* ===========================
   TYPES
=========================== */

type JwtPayload = {
  nameid: string;
  exp: number;
};

type Notification = {
  type: string;
  message: string;
  link?: string;
};

/* ===========================
   APP
=========================== */

export default function App() {

  const navigate = useNavigate();
  const { isAuth, username } = useAuth();

  const [toasts, setToasts] = useState<Notification[]>([]);

  /* ===========================
     CONNECT SIGNALR
  ============================ */

  useEffect(() => {

    if (!isAuth) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    let mounted = true;

    (async () => {
      try {

        const data = jwtDecode<JwtPayload>(token);

        if (data.exp * 1000 < Date.now()) return;

        const conn = await startNotificationHub();

        if (!conn || !mounted) return;

        conn.off("ReceiveNotification");

        conn.on("ReceiveNotification", (n: Notification) => {

          setToasts(prev => [n, ...prev]);

          window.dispatchEvent(
            new Event("notification-received")
          );

          setTimeout(() => {
            setToasts(prev => prev.slice(0, -1));
          }, 5000);
        });

      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      mounted = false;
    };

  }, [isAuth]);

  /* ===========================
     UI
  ============================ */

  return (

  <FlowProvider>   {/* 🔥 ВАЖНО */}

    {/* 🔔 BELL */}
    {isAuth && (
      <div className="bell-phone-left">
        <NotificationBell />
      </div>
    )}

    {/* 🔔 TOASTS */}
    <div className="toast-stack">
      {toasts.map((t, i) => (
        <div
          key={i}
          className="toast"
          onClick={() => {
            if (t.link) navigate(t.link);
          }}
        >
          {t.message}
        </div>
      ))}
    </div>

    {/* ROUTES */}
    <Routes>

      <Route
        path="/"
        element={<Home onAuthSuccess={() => navigate("/feed")} />}
      />

      <Route path="/feed" element={<Feed />}>
        <Route path="flow/:nodeId" element={<Flow />} />
      </Route>

      <Route
        path="/create"
        element={
          isAuth
            ? <CreateStory />
            : <Navigate to="/" />
        }
      />

      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:username" element={<Profile />} />
      <Route path="/video/:id" element={<VideoPage />} />

      <Route
        path="/edit-profile"
        element={
          isAuth
            ? <EditProfile />
            : <Navigate to="/" />
        }
      />

      <Route path="/notifications" element={<Notifications />} />
      <Route path="/explore" element={<Explore />} />

      <Route
        path="/profile/:username/followers"
        element={<FollowersPage />}
      />

      <Route
        path="/profile/:username/following"
        element={<FollowingPage />}
      />

    </Routes>

  </FlowProvider>
);
}
