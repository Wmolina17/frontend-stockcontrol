import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { NAV_GROUPS, NAV_ITEMS } from "../lib/constants";
import Logo from "./Logo";
import { LogOut, Menu, NavIcon } from "./icons";
import NotificationBell from "./NotificationBell";
import "./AppLayout.css";

function initials(nombre = "", apellido = "") {
  return `${(nombre[0] || "").toUpperCase()}${(apellido[0] || "").toUpperCase()}` || "SC";
}

export default function AppLayout() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter((item) => can(item.permission));
  const groups = NAV_GROUPS
    .map((group) => ({ group, items: visibleNav.filter((item) => item.group === group) }))
    .filter((entry) => entry.items.length > 0);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      {sidebarOpen && <div className="app-scrim" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      <aside className={`app-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="app-brand">
          <Logo size={34} />
        </div>

        <nav className="app-nav">
          {groups.map(({ group, items }) => (
            <div key={group} className="app-nav-group">
              <div className="app-nav-label">{group}</div>
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="app-sidebar-foot">
          <div className="app-user">
            <div className="app-user-avatar">{initials(user.nombre, user.apellido)}</div>
            <div>
              <div className="app-user-name">{user.nombre} {user.apellido}</div>
              <div className="app-user-role">{user.rol}</div>
            </div>
          </div>
          <button type="button" className="app-logout" onClick={handleLogout}>
            <LogOut size={15} strokeWidth={1.75} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-left">
            <button type="button" className="app-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
              <Menu size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <Logo size={28} compact showText />
          </div>
          <NotificationBell />
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
