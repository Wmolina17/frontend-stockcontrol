import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { NOTIFICATION_TYPE_CONFIG } from "../lib/constants";
import { relativeTime } from "../lib/format";
import { Bell } from "./icons";
import "./NotificationBell.css";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/notifications?limit=20");
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {
      /* keep last known state */
    }
  }, []);

  useEffect(() => {
    const start = window.setTimeout(load, 0);
    const id = window.setInterval(load, 30000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [load]);

  async function markAsRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      await load();
    } catch {
      /* ignore */
    }
  }

  async function markAllRead() {
    try {
      await api.patch("/notifications/read-all");
      await load();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="nb-wrap">
      <button
        type="button"
        className={`nb-btn ${open ? "open" : ""}`}
        onClick={() => { setOpen((v) => !v); if (!open) load(); }}
        aria-label={`Notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ""}`}
        aria-expanded={open}
      >
        <Bell size={18} strokeWidth={1.75} aria-hidden="true" />
        {unreadCount > 0 && <span className="nb-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <>
          <div className="nb-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="nb-panel" role="dialog" aria-label="Panel de notificaciones">
            <div className="nb-panel-head">
              <span className="nb-panel-title">Notificaciones</span>
              <button type="button" className="nb-mark-all" onClick={markAllRead} disabled={unreadCount === 0}>
                Marcar todas como leídas
              </button>
            </div>

            <div className="nb-list">
              {notifications.length === 0 ? (
                <div className="nb-empty">No tienes notificaciones.</div>
              ) : (
                notifications.map((n) => {
                  const cfg = NOTIFICATION_TYPE_CONFIG[n.type] || NOTIFICATION_TYPE_CONFIG.SYSTEM;
                  return (
                    <div
                      key={n._id}
                      className={`nb-item ${!n.read ? "unread" : ""}`}
                      onClick={() => !n.read && markAsRead(n._id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && !n.read && markAsRead(n._id)}
                    >
                      <div className="nb-item-body">
                        <div className="nb-item-top">
                          <span className="nb-item-title">{n.title}</span>
                          <span className="nb-item-time">{relativeTime(n.createdAt)}</span>
                        </div>
                        <div className="nb-item-desc">{n.message}</div>
                        <span className={`ui-status ${cfg.tone}`}>{cfg.label}</span>
                      </div>
                      {!n.read && <span className="nb-dot" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
