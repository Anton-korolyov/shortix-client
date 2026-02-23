export function parseJwt(token: string) {
  try {
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function getCurrentUser() {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  return {
    username: payload.username,
    email: payload.email
  };
}

export function isAuthenticated() {
  return !!localStorage.getItem("accessToken");
}
