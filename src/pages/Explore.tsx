import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getExplore } from "../api/api";
import "./explore.css";

export default function Explore() {

  const nav = useNavigate();

  const [videos, setVideos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");   // 🔥 ПОИСК

  useEffect(() => {
    resetAndLoad();
  }, [query]);
useEffect(() => {
  const t = setTimeout(() => {
    setQuery(input);
  }, 400);

  return () => clearTimeout(t);
}, [input]);
  function resetAndLoad() {
    setVideos([]);
    setPage(1);
    setHasMore(true);
    load(1, true);
  }

  async function load(p:number, replace=false) {
    if (!hasMore && !replace) return;

    const data = await getExplore(p, query);

    if (replace) {
      setVideos(data.items);
    } else {
      setVideos(v => [...v, ...data.items]);
    }

    setHasMore(data.hasMore);
    setPage(p+1);
  }

  return (
    <div className="explore-root">

      <div className="explore-phone">

        {/* HEADER */}
        <div className="explore-header">
          Explore
          <button className="back-btn-prof" onClick={() => nav("/feed")} >
            Back →
          </button>
                  {/* 🔍 SEARCH */}
<div className="explore-search">
  <span className="search-icon">
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21 21L16.65 16.65"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="11"
      cy="11"
      r="7"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
</span>

  <input
    placeholder="Search user, category or tag..."
    value={input}
    onChange={(e) => setInput(e.target.value)}
  />

  {input && (
    <button className="clear-search" onClick={() => setInput("")}>
      ✕
    </button>
  )}
</div>
        </div>



        {/* GRID */}
        <div className="explore-grid">

          {videos.map(v => (
            <div
              key={v.id}
              className="explore-card"
              onClick={() => nav(`/video/${v.id}`)}
            >
              <video
                src={`${v.url}`}
                muted
                playsInline
              />

              <div className="explore-user">
                @{v.username}
              </div>
            </div>
          ))}

        </div>
{!videos.length && !hasMore && (
  <div className="explore-empty">
    Nothing found
  </div>
)}
        {/* LOAD MORE */}
        {hasMore && (
          <button
            className="load-more"
            onClick={() => load(page)}
          >
            Load more
          </button>
        )}

      </div>

    </div>
  );
}