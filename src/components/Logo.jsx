export function LogoMark({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="currentColor" className="logo-bg" />
      <path
        d="M8 11.5L16 7l8 4.5v9L16 25l-8-4.5v-9z"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M16 7v9M8 11.5l8 4.5 8-4.5" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d="M12 20.5v-4.2M16 22.5v-6.2M20 19.5v-3.2"
        stroke="#C4D96B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({ size = 32, showText = true, compact = false, className = "" }) {
  return (
    <div className={`brand-logo ${compact ? "is-compact" : ""} ${className}`.trim()}>
      <LogoMark size={size} className="brand-logo-mark" />
      {showText && (
        <div className="brand-logo-text">
          <span className="brand-logo-name">Stock Control</span>
          {!compact && <span className="brand-logo-tag">Inventario y ventas</span>}
        </div>
      )}
    </div>
  );
}
