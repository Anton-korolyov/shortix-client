import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiGet, deleteVideo } from "../api/api";
import "./VideoPage.css";

/* =========================
   TYPES
========================= */

type Video = {
  id: string;
  url: string;
  username: string;
  storyNodeId: string;
  hasChildren: boolean;
};

/* =========================
   COMPONENT
========================= */

export default function VideoPage() {

  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
 
  // откуда пришли
  const from = location.state?.from;

  const [video, setVideo] =
    useState<Video | null>(null);

  const myUsername =
    localStorage.getItem("username");

  const isOwner =
    video?.username?.toLowerCase() ===
    myUsername?.toLowerCase();

  /* =========================
     LOAD VIDEO
  ========================= */

  useEffect(() => {

    apiGet(`/api/video/${id}`)
      .then(setVideo);

  }, [id]);

  /* =========================
     DELETE
  ========================= */

async function onDelete() {

  if (!video) return;

  if (!confirm("Delete this video?"))
    return;

  const res = await deleteVideo(video.id);

  if (res?.redirectTo === "video") {
    nav(`/video/${res.videoId}`);
    return;
  }

  if (res?.redirectTo === "feed") {
    nav("/feed");
    return;
  }

  // fallback (если вдруг сервер ничего не вернул)
  if (from === "profile") {
    nav("/profile");
  } else {
    nav("/feed");
  }
}

  if (!video) return null;

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="video-page">

      <div className="video-wrapper">

        {/* TOP ACTIONS */}
        <div className="top-actions-vid">

          {isOwner && (
            <button
              className="delete-btn-vid"
              onClick={onDelete}
            >
              🗑
            </button>
          )}

          <button
            className="back-btn-vid"
            onClick={() => nav(-1)}
          >
            →
          </button>

        </div>

        {/* VIDEO */}
        <video
          src={`${video.url}`}
          autoPlay
          loop
          muted
        />

        {/* OVERLAY */}
        <div className="video-overlay">

          <button
            className="story-btn"
            onClick={() => {
              if (video.hasChildren) {
                nav(`/flow/${video.storyNodeId}`);
              } else {
                nav("/feed");
              }
            }}
          >
            🌳 View Story
          </button>

        </div>

      </div>

    </div>
  );
}
