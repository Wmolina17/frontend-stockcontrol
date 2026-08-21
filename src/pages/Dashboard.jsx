import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { OrderStatus } from "../components/ui";
import { api } from "../lib/api";
import { NAV_ITEMS } from "../lib/constants";
import {
  AlertTriangle,
  NavIcon,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
  UserRound,
} from "../components/icons";
import { customerName, formatCOP, formatDate, productName } from "../lib/format";
import "./Dashboard.css";

const STAT_ICONS = {
  products: Package,
  lowStock: AlertTriangle,
  orders: ShoppingCart,
  sales: Receipt,
};

export default function Dashboard() {
  const { user, can } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get("/dashboard")
      .then((res) => { if (active) setData(res.data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const quickLinks = NAV_ITEMS.filter((item) => item.path !== "/" && can(item.permission));
  const stats = data?.stats || {};
  const recentOrders = data?.recent?.orders || [];
  const recentSales = data?.recent?.sales || [];
  const topProducts = data?.charts?.topProducts || [];
  const maxSold = topProducts.reduce((max, item) => Math.max(max, item.totalSold || 0), 0) || 1;

  const dateLabel = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="ui-page db">
      <header className="db-intro">
        <p className="ui-kicker">{dateLabel}</p>
        <h2 className="db-hello">Hola, {user.nombre}</h2>
        <p className="ui-lede">Resumen de inventario, pedidos y ventas del mes.</p>
      </header>

      {error && <div className="ui-alert">{error}</div>}

      <section className="db-stats" aria-label="Resumen">
        <div className="db-stat">
          <div className="db-stat-icon" aria-hidden="true"><STAT_ICONS.products size={18} strokeWidth={1.75} /></div>
          <div className="db-figure">{loading ? "—" : stats.totalProducts ?? 0}</div>
          <div className="db-caption">Productos en catálogo</div>
        </div>
        <div className={`db-stat ${stats.lowStock ? "is-warn" : ""}`}>
          <div className="db-stat-icon is-warn" aria-hidden="true"><STAT_ICONS.lowStock size={18} strokeWidth={1.75} /></div>
          <div className={`db-figure ${stats.lowStock ? "is-warn" : ""}`}>{loading ? "—" : stats.lowStock ?? 0}</div>
          <div className="db-caption">Con stock bajo</div>
        </div>
        <div className="db-stat">
          <div className="db-stat-icon" aria-hidden="true"><STAT_ICONS.orders size={18} strokeWidth={1.75} /></div>
          <div className="db-figure">{loading ? "—" : stats.pendingOrders ?? 0}</div>
          <div className="db-caption">Pedidos pendientes</div>
        </div>
        <div className="db-stat is-money">
          <div className="db-stat-icon is-accent" aria-hidden="true"><STAT_ICONS.sales size={18} strokeWidth={1.75} /></div>
          <div className="db-figure db-money">{loading ? "—" : formatCOP(stats.monthlyInvoicing)}</div>
          <div className="db-caption">{stats.monthlySales ?? 0} facturas este mes</div>
        </div>
      </section>

      <div className="db-grid">
        <section className="db-panel">
          <div className="db-section-head">
            <h3><ShoppingCart size={16} strokeWidth={1.75} aria-hidden="true" /> Pedidos recientes</h3>
            {can("orders:read") && <Link to="/pedidos" className="ui-btn-link">Ver todos →</Link>}
          </div>
          {loading ? (
            <div className="ui-empty">Cargando pedidos…</div>
          ) : recentOrders.length === 0 ? (
            <div className="ui-empty">
              <strong>No hay pedidos todavía</strong>
              Cuando se registre uno, aparecerá aquí.
              {can("orders:create") && (
                <p className="db-empty-action">
                  <Link to="/pedidos" className="ui-btn ui-btn-primary has-icon">
                    <ShoppingCart size={16} strokeWidth={1.75} aria-hidden="true" />
                    Crear pedido
                  </Link>
                </p>
              )}
            </div>
          ) : (
            <ul className="db-rows">
              {recentOrders.map((o) => (
                <li key={o._id}>
                  <div>
                    <div className="ui-name">{o.orderNumber}</div>
                    <div className="ui-hint">{customerName(o.customerId)} · entrega {formatDate(o.deliveryDate)}</div>
                  </div>
                  <OrderStatus status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="db-panel">
          <div className="db-section-head">
            <h3><Receipt size={16} strokeWidth={1.75} aria-hidden="true" /> Últimas ventas</h3>
            {can("invoices:read") && <Link to="/facturacion" className="ui-btn-link">Ver facturas →</Link>}
          </div>
          {loading ? (
            <div className="ui-empty">Cargando ventas…</div>
          ) : recentSales.length === 0 ? (
            <div className="ui-empty">
              <strong>Aún no hay facturas</strong>
              Las ventas del mes se listarán aquí.
            </div>
          ) : (
            <ul className="db-rows">
              {recentSales.map((sale) => (
                <li key={sale._id}>
                  <div>
                    <div className="ui-name">{sale.invoiceNumber}</div>
                    <div className="ui-hint">{customerName(sale.customerId)} · {formatDate(sale.createdAt)}</div>
                  </div>
                  <span className="ui-code">{formatCOP(sale.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {topProducts.length > 0 && (
        <section className="db-chart">
          <h3><TrendingUp size={16} strokeWidth={1.75} aria-hidden="true" /> Más vendidos este mes</h3>
          <ol className="db-bars">
            {topProducts.map((item) => {
              const pct = Math.round(((item.totalSold || 0) / maxSold) * 100);
              return (
                <li key={item._id || item.name} className="db-bar-row">
                  <span className="db-bar-label">{productName(item)}</span>
                  <div className="db-bar-track" aria-hidden="true">
                    <div className="db-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="db-bar-val">{item.totalSold} uds.</span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {quickLinks.length > 0 && (
        <nav className="db-jump" aria-label="Accesos rápidos">
          {quickLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              <NavIcon name={link.icon} />
              {link.label}
            </Link>
          ))}
        </nav>
      )}

      <p className="db-note">
        <UserRound size={14} strokeWidth={1.75} aria-hidden="true" />
        {stats.totalCustomers ?? 0} clientes registrados · sesión como {user.rol}
      </p>
    </div>
  );
}
