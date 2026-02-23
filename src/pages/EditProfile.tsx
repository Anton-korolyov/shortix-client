import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  uploadAvatar,
  updateProfile,
  getMyProfile
} from "../api/api";
import "./EditProfile.css";

export default function EditProfile() {

  const nav = useNavigate();

  // username из localStorage
  const username =
    localStorage.getItem("username") || "";

  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");   // ✅ ДОБАВИЛИ
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  // ===========================
  // LOAD PROFILE
  // ===========================

  useEffect(() => {

    getMyProfile()
      .then(p => {

        setBio(p.bio || "");

        if (p.avatarUrl) {
          setAvatarUrl(p.avatarUrl);  // ✅ сохраняем чистый путь
          setAvatarPreview(
            `https://localhost:7247${p.avatarUrl}`
          );
        }

      })
      .finally(() => setLoading(false));

  }, []);

  // ===========================
  // SAVE
  // ===========================

  async function save() {

    let finalAvatarUrl = avatarUrl;  // ✅ используем сохранённый путь

    if (file) {
      const res = await uploadAvatar(file);
      finalAvatarUrl = res.avatarUrl;   // сервер возвращает avatarUrl
    }

    await updateProfile({
      bio,
      avatarUrl: finalAvatarUrl
    });

    nav(-1);
  }

  // ===========================
  // LOADING
  // ===========================

  if (loading) {
    return (
      <div style={{ color: "white", padding: 40 }}>
        Loading...
      </div>
    );
  }

  // ===========================
  // UI
  // ===========================

  return (
    <div className="edit-profile-page">

      {/* BACK */}
      <button
        className="back-btn-prof"
        onClick={() => nav(-1)}
      >
        Back →
      </button>

      <div className="edit-profile-hed">
        <h2>Edit profile</h2>
      </div>

      {/* AVATAR */}
      <label className="avatar-picker">

        <input
          type="file"
          hidden
          accept="image/*"
          onChange={e => {

            const f = e.target.files?.[0];
            if (!f) return;

            setFile(f);

            // показываем превью
            setAvatarPreview(
              URL.createObjectURL(f)
            );

          }}
        />

        <img
          src={avatarPreview || "/avatar.png"}
          className="avatar-big"
          alt="avatar"
          onError={e =>
            (e.currentTarget.src = "/avatar.png")
          }
        />

        <div className="change-text">
          Change avatar
        </div>

      </label>

      {/* USERNAME */}
      <div className="edit-username">
        @{username}
      </div>

      {/* BIO */}
      <textarea
        placeholder="Your bio..."
        value={bio}
        onChange={e =>
          setBio(e.target.value)
        }
      />

      {/* SAVE */}
      <button
        className="save-btn"
        onClick={save}
      >
        Save
      </button>

    </div>
  );
}