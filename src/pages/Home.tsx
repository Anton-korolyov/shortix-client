import "./home.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginRegisterModal from "../components/LoginRegisterModal";
import Splash from "./Splash";
import { useAuth } from "../context/AuthContext";

type Props = {
  onAuthSuccess: () => void;   // 🔥 ДОБАВИЛИ
};

export default function Home({ onAuthSuccess }: Props) {   // 🔥 ДОБАВИЛИ
  const { isAuth } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [checking, setChecking] = useState(true);

  const nav = useNavigate();

  // ===========================
  // SPLASH + AUTO LOGIN
  // ===========================
 useEffect(() => {
  if (isAuth) {
    const redirect = localStorage.getItem("afterLoginRedirect");
    if (redirect) {
      // не мешаем редиректу после логина
      setChecking(false);
      return;
    }
    nav("/feed", { replace: true });
  } else {
    setChecking(false);
  }
}, [isAuth, nav]);

  // ===========================
  // START STORY
  // ===========================
function startStory() {
  if (!isAuth) {

    // 🔥 сохраняем куда пользователь хотел попасть
    localStorage.setItem("afterLoginRedirect", "/create");

    setShowAuth(true);
  } else {
    nav("/create");
  }
}

  // ===========================
  // SPLASH
  // ===========================
  if (checking) {
    return <Splash />;
  }

  // ===========================
  // UI
  // ===========================
  return (
    <>
      <div className="home">

        <div className="home-header">
          <h1>PIQO</h1>
        </div>

        <div className="hero">
          <h2>Videos that don’t end.</h2>
          <p>Create short videos. Choose what happens next.</p>

          <div className="hero-buttons">

            <button onClick={() => nav("/feed")}>
              ▶ Watch Videos
            </button>

            <button
              className="primary"
              onClick={startStory}
            >
              ➕ Start Story
            </button>

          </div>
        </div>

      </div>

      {showAuth && (
        <LoginRegisterModal
          onClose={() => setShowAuth(false)}

          // 🔥 ВАЖНОЕ ИЗМЕНЕНИЕ
       onSuccess={() => {

  onAuthSuccess();
  setShowAuth(false);

  const redirect =
    localStorage.getItem("afterLoginRedirect");

  if (redirect) {
    localStorage.removeItem("afterLoginRedirect");
    nav(redirect);
  } else {
    nav("/feed");
  }

}}
        />
      )}
    </>
  );
}
