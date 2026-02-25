import { useState } from "react";
import { login, register } from "../api/api";
import "./loginRegisterModal.css";
import { useAuth } from "../context/AuthContext";
type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function LoginRegisterModal({ onClose, onSuccess }: Props) {

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  function parseJwt(token: string) {
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  }

async function submit() {
  try {
    setLoading(true);

    const res =
      mode === "login"
        ? await login(email, password)
        : await register(email, password);

    const payload = parseJwt(res.accessToken);

    authLogin(
      res.accessToken,
      res.refreshToken,
      payload.username
    );

    const redirect =
      localStorage.getItem("afterLoginRedirect");

    if (redirect) {
      localStorage.removeItem("afterLoginRedirect");
      window.location.href = redirect;
    }

    onSuccess();

  } catch {
    alert("Auth failed");
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="auth-overlay">

      <div className="auth-modal">

        <h2>
          {mode === "login" ? "Login" : "Register"}
        </h2>

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button disabled={loading} onClick={submit}>
          {loading ? "Please wait..." : "Continue"}
        </button>

        <p className="switch">
          {mode === "login" ? (
            <span onClick={() => setMode("register")}>
              No account? Register
            </span>
          ) : (
            <span onClick={() => setMode("login")}>
              Already have account? Login
            </span>
          )}
        </p>

        <button
          className="close"
          onClick={onClose}
        >
          ✕
        </button>

      </div>

    </div>
  );
}
