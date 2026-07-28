import { createContext, useContext, useEffect, useState } from "react";
import client, { setAccessToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    const res = await client.post("/auth/login", { email, password });
    setAccessToken(res.data.data.accessToken);
    setUser(res.data.data.user);
    return res.data.data.user;
  }

  async function logout() {
    await client.post("/auth/logout").catch(() => {});
    setAccessToken(null);
    setUser(null);
  }

  useEffect(() => {
    // On app load, try a silent refresh using the httpOnly cookie - if
    // it's still valid, the user stays logged in across page reloads.
    (async () => {
      try {
        const res = await client.post("/auth/refresh");
        setAccessToken(res.data.data.accessToken);
        setUser(res.data.data.user);
      } catch (err) {
        // No valid session - that's fine, user just needs to log in.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
