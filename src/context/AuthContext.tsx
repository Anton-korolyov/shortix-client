import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

type AuthContextType = {
  isAuth: boolean;
  username: string | null;
  login: (accessToken: string, refreshToken: string, username: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

/* =========================
   PROVIDER
========================= */

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [isAuth, setIsAuth] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  // init from localStorage
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const name = localStorage.getItem("username");

    if (token && name) {
      setIsAuth(true);
      setUsername(name);
    }
  }, []);

  function login(
    accessToken: string,
    refreshToken: string,
    username: string
  ) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("username", username);

    setIsAuth(true);
    setUsername(username);
  }

  function logout() {
    localStorage.clear();
    setIsAuth(false);
    setUsername(null);
  }

  return (
    <AuthContext.Provider
      value={{ isAuth, username, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================
   HOOK
========================= */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
