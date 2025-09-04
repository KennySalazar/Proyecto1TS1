
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(!!token); // si hay token, validar /me

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get("/me")
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (correo, password) => {
    const { data } = await api.post("/login", { correo, password });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);                // ← actualiza inmediatamente
  };

  const logout = async () => {
    try { await api.post("/logout"); } catch {}
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, token, login, logout, loading }}>
      {/* mientras valida /me, no renderizar rutas */}
      {loading ? null : children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
