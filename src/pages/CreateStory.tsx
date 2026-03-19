import { useState, useEffect } from "react";
import {
  uploadVideo,
  canContinue,
  getVideoCategories
} from "../api/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./CreateStory.css";

export default function CreateStory() {

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const navigate = useNavigate();
  const [params] = useSearchParams();
  const parentNodeId = params.get("parent");

  // ===========================
  // LOAD CATEGORIES
  // ===========================

  useEffect(() => {
    getVideoCategories()
      .then(setCategories)
      .catch(() => alert("Failed to load categories"));
  }, []);

  // ===========================
  // CHECK BRANCH LIMIT
  // ===========================

  useEffect(() => {
    if (!parentNodeId) {
      setChecking(false);
      return;
    }

    canContinue(parentNodeId)
      .then(res => {
        if (!res.canContinue) {
          alert("This branch is full (5/5)");
          navigate(-1);
        }
      })
      .finally(() => setChecking(false));
  }, [parentNodeId]);

  // ===========================
  // UPLOAD
  // ===========================

  async function handleUpload() {
    if (!file) return alert("Select video");
    if (!selectedCategory) return alert("Select category");

    try {
      setLoading(true);

      await uploadVideo(
        file,
        parentNodeId,
        selectedCategory,
        tags
      );

      navigate("/feed");
    }
    catch {
      alert("Upload error");
    }
    finally {
      setLoading(false);
    }
  }

  if (checking) {
    return <div className="create-story">Checking...</div>;
  }

  return (
    <div className="create-story">

      {/* TOP */}
      <div className="create-top">
        <button className="back-button" onClick={() => navigate(-1)}>
          Back →
        </button>

        <h2>
          {parentNodeId ? "Continue Story" : "Create Story"}
        </h2>
      </div>

      {/* VIDEO */}
      <div className="video-area">

        <input
          id="videoInput"
          type="file"
          accept="video/*"
          hidden
          onChange={e => {
            const f = e.target.files?.[0];
            if (!f) return;

            setFile(f);
            setPreviewUrl(URL.createObjectURL(f));
          }}
        />

        <label htmlFor="videoInput" className="video-click-area">

          {!previewUrl && (
            <div className="video-placeholder">
              Tap to select video
            </div>
          )}

          {previewUrl && (
            <>
              <video
                src={previewUrl}
                className="video-preview-full"
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="change-hint">
                Tap to change video
              </div>
            </>
          )}

        </label>

      </div>

      {/* CONTROLS */}
      <div className="controls">

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="">Select category</option>

          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

   <input
  placeholder="Add tag and press Enter"
  value={tagInput}
  onChange={e => setTagInput(e.target.value)}
  onKeyDown={e => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();

      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  }}
/>

        <div className="tag-list">
          {tags.map((t, i) => (
            <span key={i} onClick={() =>
              setTags(tags.filter(x => x !== t))
            }>
              #{t} ✕
            </span>
          ))}
        </div>

      </div>

      {/* BOTTOM */}
      <div className="create-bottom">
        <button
          className="upload-button"
          disabled={loading}
          onClick={handleUpload}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

    </div>
  );
}