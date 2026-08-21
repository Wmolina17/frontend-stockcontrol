import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from "../lib/constants";
import { AlertTriangle, Eye, EyeOff, ORDER_STATUS_ICONS, PackageX, Search, X } from "./icons";

export function PageHeader({ kicker, title, lede, actions }) {
  return (
    <header className="ui-head">
      <div>
        {kicker && <p className="ui-kicker">{kicker}</p>}
        <h2 className="ui-title">{title}</h2>
        {lede && <p className="ui-lede">{lede}</p>}
      </div>
      {actions}
    </header>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="ui-empty">
      {title && <strong>{title}</strong>}
      {description}
      {action && <div className="ui-empty-action">{action}</div>}
    </div>
  );
}

export function DataTable({ children }) {
  return <div className="ui-table-wrap">{children}</div>;
}

/** Botón compacto solo icono con tooltip */
export function IconBtn({ icon: Icon, label, danger, disabled, type = "button", onClick }) {
  return (
    <button
      type={type}
      className={`ui-icon-btn${danger ? " is-danger" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      <span className="ui-tooltip" role="tooltip">{label}</span>
    </button>
  );
}

/** Botón pequeño con texto (formularios secundarios) */
export function BtnSm({ children, danger, disabled, type = "button", onClick, icon: Icon }) {
  return (
    <button
      type={type}
      className={`ui-btn ui-btn-sm${danger ? " ui-btn-sm-danger" : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      {Icon && <Icon size={15} strokeWidth={1.75} aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Botón primario/secundario con icono opcional */
export function Btn({ children, primary, ghost, danger, disabled, type = "button", onClick, icon: Icon }) {
  const cls = [
    "ui-btn",
    primary && "ui-btn-primary",
    ghost && "ui-btn-ghost",
    danger && "ui-btn-danger",
    Icon && children && "has-icon",
  ].filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick}>
      {Icon && <Icon size={16} strokeWidth={1.75} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function PassToggle({ show, onToggle }) {
  const Icon = show ? EyeOff : Eye;
  const label = show ? "Ocultar contraseña" : "Mostrar contraseña";
  return (
    <button
      type="button"
      className="ui-pass-toggle"
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}

export function StockStatus({ stock, minimumStock = 10 }) {
  if (stock === 0) {
    return (
      <span className="ui-status has-icon is-danger">
        <PackageX size={13} strokeWidth={2} aria-hidden="true" />
        {stock}
      </span>
    );
  }
  if (stock <= minimumStock) {
    return (
      <span className="ui-status has-icon is-warn">
        <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" />
        {stock}
      </span>
    );
  }
  return <span className="ui-status is-ok">{stock}</span>;
}

export function SearchInput({ id, value, onChange, placeholder }) {
  return (
    <div className="ui-search">
      <Search size={16} strokeWidth={1.75} className="ui-search-icon" aria-hidden="true" />
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export function OrderStatus({ status }) {
  const Icon = ORDER_STATUS_ICONS[status];
  const label = ORDER_STATUS_LABELS[status] || status;
  const tone = ORDER_STATUS_COLORS[status] || "is-muted";
  return (
    <span className={`ui-status has-icon ${tone}`}>
      {Icon && <Icon size={13} strokeWidth={2} aria-hidden="true" />}
      {label}
    </span>
  );
}

export function Modal({ title, subtitle, wide, onClose, children }) {
  return (
    <div className="ui-overlay" onClick={onClose}>
      <div className={`ui-modal ${wide ? "is-wide" : ""}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ui-modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="ui-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, description, confirmLabel = "Confirmar", danger, onConfirm, onClose }) {
  return (
    <div className="ui-overlay" onClick={onClose}>
      <div className="ui-dialog" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <h2 className="ui-title">{title}</h2>
        {description && <p className="ui-lede">{description}</p>}
        <div className="ui-actions">
          <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className={`ui-btn ${danger ? "ui-btn-danger" : "ui-btn-primary"}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
