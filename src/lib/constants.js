export const ROLES = {
  ADMIN: "Administrador",
  INVENTORY_MANAGER: "Encargado de Inventario",
  OPERATIONS_MANAGER: "Encargado de Operaciones",
  SELLER: "Vendedor",
};

export const ROLE_PERMISSIONS = {
  ADMIN: ["*"],
  INVENTORY_MANAGER: [
    "dashboard:read",
    "products:read", "products:create", "products:update", "products:delete",
    "categories:read", "categories:create", "categories:update", "categories:delete",
    "inventory:read", "inventory:create",
    "notifications:read", "notifications:update",
    "settings:read",
  ],
  OPERATIONS_MANAGER: [
    "dashboard:read",
    "orders:read", "orders:create", "orders:update",
    "customers:read", "products:read", "categories:read",
    "notifications:read", "notifications:update",
    "settings:read",
  ],
  SELLER: [
    "dashboard:read",
    "customers:read", "customers:create", "customers:update",
    "products:read", "categories:read",
    "invoices:read",
    "notifications:read", "notifications:update",
    "settings:read",
  ],
};

export const ORDER_STATUS_LABELS = {
  PENDING: "Pendiente",
  IN_PROCESS: "En proceso",
  COMPLETED: "Completado",
  DELIVERED: "Entregado",
};

export const ORDER_STATUS_COLORS = {
  PENDING: "is-pending",
  IN_PROCESS: "is-info",
  COMPLETED: "is-ok",
  DELIVERED: "is-delivered",
};

export const MOVEMENT_TYPE_LABELS = {
  IN: "Entrada",
  OUT: "Salida",
};

export const NOTIFICATION_TYPE_CONFIG = {
  LOW_STOCK: { label: "Stock bajo", kind: "stock", tone: "is-warn" },
  OUT_OF_STOCK: { label: "Agotado", kind: "stock", tone: "is-danger" },
  PENDING_ORDER: { label: "Pedido pendiente", kind: "pedido", tone: "is-accent" },
  DELAYED_ORDER: { label: "Por vencer", kind: "vencimiento", tone: "is-danger" },
  SYSTEM: { label: "Sistema", kind: "pedido", tone: "is-muted" },
};

export const ROLE_COLORS = {
  ADMIN: "is-muted",
  INVENTORY_MANAGER: "is-accent",
  OPERATIONS_MANAGER: "is-warn",
  SELLER: "is-ok",
};

export const IVA_RATE = 0.19;

export const NAV_ITEMS = [
  { path: "/", label: "Inicio", icon: "home", permission: "dashboard:read", group: "Principal" },
  { path: "/productos", label: "Productos", icon: "box", permission: "products:read", group: "Gestión" },
  { path: "/inventario", label: "Inventario", icon: "layers", permission: "inventory:read", group: "Gestión" },
  { path: "/clientes", label: "Clientes", icon: "users", permission: "customers:read", group: "Gestión" },
  { path: "/pedidos", label: "Pedidos", icon: "cart", permission: "orders:read", group: "Gestión" },
  { path: "/facturacion", label: "Facturación", icon: "invoice", permission: "invoices:read", group: "Operaciones" },
  { path: "/reportes", label: "Reportes", icon: "chart", permission: "reports:read", group: "Operaciones" },
  { path: "/usuarios", label: "Usuarios", icon: "shield", permission: "users:read", group: "Administración" },
  { path: "/configuracion", label: "Configuración", icon: "settings", permission: "settings:read", group: "Administración" },
];

export const NAV_GROUPS = ["Principal", "Gestión", "Operaciones", "Administración"];

export const DEMO_ACCOUNTS = [
  { email: "admin@stockcontrol.com", password: "admin123", role: "Administrador", name: "Admin Sistema" },
  { email: "inventario@stockcontrol.com", password: "inventario123", role: "Encargado de Inventario", name: "Carlos Inventario" },
  { email: "operaciones@stockcontrol.com", password: "operaciones123", role: "Encargado de Operaciones", name: "María Operaciones" },
  { email: "ventas@stockcontrol.com", password: "ventas123", role: "Vendedor", name: "Juan Vendedor" },
];

export function hasPermission(role, permission) {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes(permission);
}
