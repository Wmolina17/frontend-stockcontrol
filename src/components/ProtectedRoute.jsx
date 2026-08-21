import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { NAV_ITEMS } from "../lib/constants";

export default function ProtectedRoute({ children, path = "" }) {
  const { user, isAuthenticated, loading, can } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-boot">
        <div className="app-boot-card">Cargando sesión…</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (path) {
    const navItem = NAV_ITEMS.find((item) => item.path === path);
    if (navItem && !can(navItem.permission)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
