const TOKEN_KEY = "auth_token";

interface TokenClaims {
  role?: string;
  iat?: number;
  exp?: number;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function decodeToken(token: string): TokenClaims | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function getRole(): string | null {
  const token = getToken();
  if (!token) return null;
  return decodeToken(token)?.role ?? null;
}

export function isAdmin(): boolean {
  return getRole() === "admin";
}

/** The session's idle-timeout window (server's ACCESS_TOKEN_EXPIRE_MINUTES), in ms, derived from the token's own iat/exp so the frontend never has to duplicate that config. */
export function getSessionTimeoutMs(): number | null {
  const token = getToken();
  if (!token) return null;
  const claims = decodeToken(token);
  if (!claims?.iat || !claims?.exp) return null;
  return (claims.exp - claims.iat) * 1000;
}

export function getTokenExpiryMs(): number | null {
  const token = getToken();
  if (!token) return null;
  const claims = decodeToken(token);
  return claims?.exp ? claims.exp * 1000 : null;
}

/** Exchanges the current token for a freshly-expiring one; called on user activity to keep an active session alive. */
export async function refreshToken(apiUrl: string): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${apiUrl}/api/auth/refresh`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setToken(data.token);
    return true;
  } catch {
    return false;
  }
}
