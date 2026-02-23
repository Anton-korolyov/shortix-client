import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";

import {
  Home,
  Search,
  User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getFeed, toggleLike } from "../api/api";
import { useSwipeable } from "react-swipeable";
import "../pages/feed.css";
import LoginRegisterModal from "../components/LoginRegisterModal";
import CommentsModal from "../components/CommentsModal";
import { startNotificationHub } from "../api/notificationHub";
import { useAuth } from "../context/AuthContext";
import { Outlet } from "react-router-dom";
/* ===========================
   TYPES
=========================== */

type Video = {
  id: string;
  videoId: string;
  url: string;
  likes: number;
  comments: number;
  hasChildren: boolean;
  username: string;
  avatarUrl?: string;
  isLiked: boolean;
  bio?: string;
   category?: string;
  tags?: string[];
};

/* ===========================
   FEED
=========================== */

export default function Feed() {
 
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const { isAuth , username,logout} = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [commentsNodeId, setCommentsNodeId] =
    useState<string | null>(null);

  const [pausedMap, setPausedMap] =
    useState<{ [key: number]: boolean }>({});

  const [likeBurst] =
    useState<{ [key: number]: boolean }>({});

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const loadingRef = useRef(false);

  // 🔥 FOR YOU / FOLLOWING
  const [feedMode, setFeedMode] =
    useState<"foryou" | "following">("foryou");


    const [restored, setRestored] = useState(false);
  /* ===========================
     LOGIN EVENT
  =========================== */

  useEffect(() => {
    const handler = () => setShowAuth(true);
    window.addEventListener("openLogin", handler);
    return () =>
      window.removeEventListener("openLogin", handler);
  }, []);

  /* ===========================
     FIX SCROLL
  =========================== */

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);
/* ===========================
   REALTIME LIKE + COMMENTS
=========================== */

useEffect(() => {

  if (!isAuth) return;

  startNotificationHub().then(conn => {
    if (!conn) return;

    // ❤️ LIKE
    conn.off("VideoLiked");
    conn.on("VideoLiked", (data: {
      nodeId: string;
      liked: boolean;
      count: number;
    }) => {

      setVideos(vs =>
        vs.map(v =>
          v.id === data.nodeId
            ? {
                ...v,
                isLiked: data.liked,
                likes: data.count
              }
            : v
        )
      );

    });

    // 💬 COMMENT COUNT
    conn.off("VideoCommented");
    conn.on("VideoCommented", (data: {
      nodeId: string;
      count: number;
    }) => {

      setVideos(vs =>
        vs.map(v =>
          v.id === data.nodeId
            ? {
                ...v,
                comments: data.count
              }
            : v
        )
      );

    });

  });

}, []);
useEffect(() => {
  if (localStorage.getItem("swipeHintShown")) return;

  setTimeout(() => {
    setShowSwipeHint(false);
    localStorage.setItem("swipeHintShown", "1");
  }, 2000);
}, []);
  /* ===========================
     RESET ON MODE CHANGE
  =========================== */

useEffect(() => {

  async function reload() {
    setRestored(false);
    // 🔒 если не залогинен — following запрещён
    if (
      feedMode === "following" &&
      !isAuth
    ) {
      setFeedMode("foryou");
      return;
    }

    setInitialLoading(true);

    setVideos([]);
    setHasMore(true);
    loadingRef.current = false;

    const data = await getFeed(
      1,
      feedMode === "following"
    );

    setVideos(data.items);
    setHasMore(data.hasMore);
    setPage(2);

    setInitialLoading(false);
  }

  reload();

}, [feedMode]);
useEffect(() => {
  if (page === 1) return;
  load(page);
}, [page]);

  async function load(p: number) {

    if (!hasMore || loadingRef.current) return;

    loadingRef.current = true;

    try {

      const data = await getFeed(
        p,
        feedMode === "following"
      );

      setVideos(prev => {
        const ids = new Set(prev.map(v => v.id));
        const unique = data.items.filter(
          (v: Video) => !ids.has(v.id)
        );
        return [...prev, ...unique];
      });

      setHasMore(data.hasMore);

    } catch (e) {
      console.error("Feed error", e);
    } finally {
      loadingRef.current = false;
    }
  }

  /* ===========================
     AUTOPLAY
  =========================== */

  useEffect(() => {

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {

          const v =
            entry.target as HTMLVideoElement;

          const index =
            Number(v.dataset.index);

          if (entry.isIntersecting) {
            if (v.paused) {
    v.play().catch(() => {});
  }
            setPausedMap(p => ({
              ...p,
              [index]: false
            }));
            setCurrentIndex(index);
          } else {
            v.pause();
            setPausedMap(p => ({
              ...p,
              [index]: true
            }));
          }

        });
      },
      { threshold: 0.7 }
    );

    videoRefs.current.forEach(
      v => v && observer.observe(v)
    );

    return () => observer.disconnect();

  }, [videos]);

  /* ===========================
     RESTORE POSITION
  =========================== */

useLayoutEffect(() => {

  if (restored) return;

  const restoreId =
    sessionStorage.getItem("feedRestoreId");

  if (!restoreId) return;
  if (videos.length === 0) return;

  const index = videos.findIndex(
    v => v.id === restoreId
  );

  console.log("RESTORE ID:", restoreId);
  console.log("FOUND INDEX:", index);

  if (index >= 0) {

    setCurrentIndex(index);

    requestAnimationFrame(() => {

      const el = videoRefs.current[index];

      if (el) {
        el.scrollIntoView({
          behavior: "auto",
          block: "center"
        });
      }

    });

    setRestored(true);
    sessionStorage.removeItem("feedRestoreId");
  }

}, [videos, restored]);

  /* ===========================
     SWIPE
  =========================== */

  const swipeHandlers = useSwipeable({
    onSwipedRight: () => {

      const v = videos[currentIndex];
      if (!v || !v.hasChildren) return;

      sessionStorage.setItem(
        "feedIndex",
        currentIndex.toString()
      );
sessionStorage.setItem("feedRestoreId", v.id);
console.log("SAVED ID:", v.id);
navigate(`/feed/flow/${v.id}`);
    },
    delta: 80,
    trackMouse: true
  });

  /* ===========================
     PLAY / PAUSE
  =========================== */

  function toggle(i: number) {

    const v = videoRefs.current[i];
    if (!v) return;

    if (v.paused) {
      v.play();
      setPausedMap(p => ({
        ...p,
        [i]: false
      }));
    } else {
      v.pause();
      setPausedMap(p => ({
        ...p,
        [i]: true
      }));
    }
  }

  /* ===========================
     LIKE
  =========================== */
async function likeVideo(id: string) {

  if (!isAuth) {
    setShowAuth(true);
    return;
  }

  try {

    const res = await toggleLike(id);
    // res = { liked: boolean, count: number }

    setVideos(vs =>
      vs.map(v =>
        v.id === id
          ? {
              ...v,
              isLiked: res.liked,
              likes: res.count
            }
          : v
      )
    );

  } catch {
    setShowAuth(true);
  }
}



  /* ===========================
     SCROLL
  =========================== */

  function onScroll(
    e: React.UIEvent<HTMLDivElement>
  ) {

    const el = e.currentTarget;

    if (
      el.scrollTop + el.clientHeight >=
        el.scrollHeight - 300 &&
      hasMore &&
      !loadingRef.current
    ) {
      setPage(p => p + 1);
    }
  }

  /* ===========================
     UI
  =========================== */

  return (
    <div className="feed-root">

      {/* ===== TABS ===== */}
      <div className="feed-tabs">
        <button
          className={
            feedMode === "foryou"
              ? "active"
              : ""
          }
          onClick={() =>
            setFeedMode("foryou")
          }
        >
          For You
        </button>
         {/* LOGOUT */}
          <button
  className="logout-top"
  onClick={() => {
    logout();
    navigate("/");
  }}
>
  ⎋
</button>
  {isAuth && (
  <button
    className={feedMode === "following" ? "active" : ""}
    onClick={() => setFeedMode("following")}
  >
    Following
  </button>
)}
      </div>

      <div
        {...swipeHandlers}
        className="feed"
        onScroll={onScroll}
      >
{initialLoading && (
  <>
    <div className="skeleton" />
    <div className="skeleton" />
  </>
)}
        {videos.map((v, i) => (

          <div key={v.id} className="video-slide">

            <video
              className="feed-video"
              data-index={i}
              ref={el => {
                if (el)
                  videoRefs.current[i] = el;
              }}
              src={`${API}${v.url}`}
              loop
              playsInline
              onClick={() => toggle(i)}
            />
{/* CATEGORY + TAGS */}
{v.hasChildren && showSwipeHint && (
  <div className="swipe-hint-left">
    {v.hasChildren && showSwipeHint && (
  <div className="swipe-hint-left">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12H18M18 12L13 7M18 12L13 17"
        stroke="white"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
)}
  </div>
)}
<div className="video-meta">

  {v.category && (
    <div className="video-category">
      {v.category}
    </div>
  )}

  {v.tags && v.tags.length > 0 && (
    <div className="video-tags">
      {v.tags.map((t, i) => (
        <span key={i}>#{t}</span>
      ))}
    </div>
  )}

</div>
   

            {pausedMap[i] && (
              <div className="play-overlay">
                ▶
              </div>
            )}

            {likeBurst[i] && (
              <div className="like-burst">
                ❤️
              </div>
            )}

            {/* USER */}
            <div className="user-left">

              <img
                className="user-avatar"
                src={
                  v.avatarUrl
                    ? `${API}${v.avatarUrl}`
                    : "/avatar.png"
                }
                alt="avatar"
              />

              <div className="user-info">

                <span
                  className="username"
                  onClick={() =>
                    navigate(
                      `/profile/${v.username}`
                    )
                  }
                >
                  @{v.username}
                </span>
                 <br/>
                {v.bio && (
                  <span className="video-title">
                    {v.bio}
                  </span>
                )}

              </div>

            </div>

            {/* ACTIONS */}
            <div className="bottom-actions">

              <div className="bottom-right">

                <div>
                 <button
  disabled={v.username === username}
  onClick={() => likeVideo(v.id)}
  style={{
    opacity: v.username === username ? 0.4 : 1,
    pointerEvents: v.username === username ? "none" : "auto"
  }}
>
  {v.isLiked ? "❤️" : "🤍"}
</button>
                  <span>{v.likes}</span>
                </div>

                <div>
                <button
  onClick={() => {
    if (!isAuth) {
      setShowAuth(true);
      return;
    }
    setCommentsNodeId(v.id);
  }}
>
  💬
</button>
                  <span>{v.comments}</span>
                </div>


              </div>

            </div>
  <div className="bottom-nav">
  <button onClick={() => navigate("/feed")}>
    <Home size={22} />
  </button>

  <button onClick={() => navigate("/explore")}>
    <Search size={22} />
  </button>

                {v.hasChildren && (
                  <div>
                    <button
                    onClick={() => {
  sessionStorage.setItem(
    "feedRestoreId",
    v.id
  );
  console.log("SAVED ID:", v.id);
navigate(`/feed/flow/${v.id}`);
}}
                    >
                      ➜
                    </button>
                
                  </div>
                )}

                {!v.hasChildren && (
                  <div>
                    <button
  onClick={() => {
    setSelectedParentId(v.id);
    setShowCreateSheet(true);
  }}
>
  ➕
</button>
                   
                  </div>
                )}

  <button onClick={() => navigate(`/profile/${username}`)}>
    <User size={22} />
  </button>
</div>


          </div>

        ))}

        {showAuth && (
          <LoginRegisterModal
            onClose={() =>
              setShowAuth(false)
            }
            onSuccess={() =>
              setShowAuth(false)
            }
          />
        )}

        {commentsNodeId && (
          <CommentsModal
            nodeId={commentsNodeId}
            onClose={() =>
              setCommentsNodeId(null)
            }
          />
        )}

      </div>



{showCreateSheet && (
  <div
    className="sheet-overlay"
    onClick={() => setShowCreateSheet(false)}
  >
    <div
      className="sheet"
      onClick={(e) => e.stopPropagation()}
    >

      <h3>Что создать?</h3>

      {/* Новое видео */}
      <button
        className="sheet-option"
        onClick={() => {
          setShowCreateSheet(false);
          navigate("/create");
        }}
      >
        ▶️ New Story
      </button>

      {/* Продолжение */}
      
      <button
        className="sheet-option"
        onClick={() => {
          if (!selectedParentId) return;
          setShowCreateSheet(false);
          navigate(`/create?parent=${selectedParentId}`);
        }}
      >
        🔗 Continue Story
      </button>

      <button
        className="sheet-cancel"
        onClick={() => setShowCreateSheet(false)}
      >
          Cancel
      </button>

    </div>
  </div>
  
)}
    <Outlet />
    </div>
  );
}
