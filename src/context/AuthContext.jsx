import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import { api, clearTokens, getTokens, setTokens } from "../lib/api";
import { hasPermission, ROLES } from "../lib/constants";

function mapUser(user) {
  if (!user) return null;
  const id = user._id || user.id;
  return {
    id,
    _id: id,
    name: user.name,
    lastname: user.lastname,
    email: user.email,
    role: user.role,
    isActive: user.isActive !== false,
    nombre: user.name,
    apellido: user.lastname,
    correo: user.email,
    rol: ROLES[user.role] || user.role,
    activo: user.isActive !== false,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const { accessToken } = getTokens();
      if (!accessToken) {
        setUser(null);
        return;
      }
      const res = await api.get("/auth/me");
      setUser(mapUser(res.data));
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadUser();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadUser]);

  const login = useCallback(async (email, password, remember = true) => {
    const res = await api.post("/auth/login", { email, password });
    if (!res.data?.accessToken) throw new Error("No se pudo iniciar sesión");
    setTokens(res.data.accessToken, res.data.refreshToken, remember);
    setUser(mapUser(res.data.user));
    return mapUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    const { refreshToken } = getTokens();
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken }).catch(() => {});
    }
    clearTokens();
    setUser(null);
  }, []);

  const can = useCallback((permission) => hasPermission(user?.role, permission), [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(user),
      hasPermission: can,
      can,
    }),
    [user, loading, login, logout, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
