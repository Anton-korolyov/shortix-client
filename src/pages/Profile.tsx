import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  apiGet,
  toggleFollow,
  getFollowCount,
  isFollowing,
  getMyVideosPaged,
  getUserVideosPaged
} from "../api/api";
import "./Profile.css";

type Video = {
  id: string;
  previewUrl: string;
  createdAt?: string;
};

type ProfileInfo = {
  username: string;
  avatarUrl?: string;
  bio?: string;
};

type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export default function Profile() {
  const { username } = useParams();
  const nav = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const [videos, setVideos] = useState<Video[]>([]);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);

  const myUsername = localStorage.getItem("username");

  const [followStats, setFollowStats] = useState<{ followers: number; following: number }>({
    followers: 0,
    following: 0
  });

  const [following, setFollowing] = useState(false);

  // 🔥 paging + search
  const PAGE_SIZE = 18;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const [q, setQ] = useState("");

  const isOwner =
    profile?.username?.toLowerCase() === myUsername?.toLowerCase();

  async function loadVideos(p: number, reset: boolean, whoUsername: string, mine: boolean) {
    const data: Paged<Video> = mine
      ? await getMyVideosPaged(p, PAGE_SIZE, q)
      : await getUserVideosPaged(whoUsername, p, PAGE_SIZE, q);

    setHasMore(!!data.hasMore);
    setTotal(data.total);
    setPage(data.page);

    setVideos(prev => (reset ? data.items : [...prev, ...data.items]));
  }

  // LOAD PROFILE + FIRST PAGE
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setVideos([]);
        setPage(1);
        setHasMore(true);
        setTotal(0);

        let p: ProfileInfo;
        let whoUsername: string;
        let mine = false;

        if (username) {
          p = await apiGet(`/api/profile/${username}`);
          whoUsername = p.username;
        } else {
          p = await apiGet("/api/profile/me");
          whoUsername = p.username;
          mine = true;
        }

        if (cancelled) return;

        setProfile(p);

        const stats = await getFollowCount(p.username);
        if (!cancelled) setFollowStats(stats);

        if (p.username !== myUsername) {
          const f = await isFollowing(p.username);
          if (!cancelled) setFollowing(f.following);
        }

        // first page
        await loadVideos(1, true, whoUsername, mine);
      } catch (e) {
        // можешь вывести toast
        console.error(e);
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, q]);

  // FOLLOW CLICK
  async function onFollow() {
    if (!profile) return;

    const res = await toggleFollow(profile.username);
    setFollowing(res.following);

    const stats = await getFollowCount(profile.username);
    setFollowStats(stats);
  }

  async function onLoadMore() {
    if (!profile) return;
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const mine = profile.username?.toLowerCase() === myUsername?.toLowerCase();
      await loadVideos(page + 1, false, profile.username, mine);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="app-wrapper">
      <div className="phone-frame">
        <div className="profile-page">
          <button className="back-btn-prof" onClick={() => nav("/feed")}>
            Back →
          </button>

          {/* ===== HEADER ===== */}
          <div className="profile-header">
            <div className="profile-avatar">
              <img
                src={
                  profile?.avatarUrl
                    ? `${API}${profile.avatarUrl}`
                    : "/avatar.png"
                }
                alt="avatar"
              />
            </div>

            <h2 className="profile-username">@{profile?.username}</h2>

            {profile?.bio && <div className="profile-bio">{profile.bio}</div>}

            {/* ===== STATS ===== */}
            <div className="profile-stats">
              <div>
                <strong>{total}</strong>
                <span>Videos</span>
              </div>

            <div
  className="stat-click"
  onClick={() =>
    nav(`/profile/${username}/followers`)
  }
>
  <strong>{followStats.followers}</strong>
  <span>Followers</span>
</div>

<div
  className="stat-click"
  onClick={() =>
    nav(`/profile/${username}/following`)
  }
>
  <strong>{followStats.following}</strong>
  <span>Following</span>
</div>
            </div>

            {/* ===== BUTTON ===== */}
            {isOwner ? (
              <button className="profile-action-btn" onClick={() => nav("/edit-profile")}>
                Edit Profile
              </button>
            ) : (
              <button className="profile-action-btn" onClick={onFollow}>
                {following ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>

          {/* ===== SEARCH MY VIDEOS ===== */}
          <div className="explore-search">
            <span className="search-icon">🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={isOwner ? "Search my videos..." : "Search videos..."}
            />
            {q && (
              <button className="clear-search" onClick={() => setQ("")}>
                ✕
              </button>
            )}
          </div>

          {/* ===== GRID ===== */}
          <div className="profile-grid">
            {videos.map(v => (
              <div
                key={v.id}
                className="grid-item"
                onClick={() => nav(`/video/${v.id}`, { state: { from: "profile" } })}
              >
                <video
                  src={`${API}${v.previewUrl}`}
                  muted
                  playsInline
                  preload="metadata"
                />
              </div>
            ))}
          </div>

          {/* LOAD MORE */}
          {hasMore && (
            <button className="load-more" onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}

          {!hasMore && videos.length === 0 && (
            <div className="explore-empty">{q ? "No videos found" : "No videos yet"}</div>
          )}
        </div>
      </div>
    </div>
  );
}