export function formatCOP(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function formatDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function relativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return formatDate(value);
}

export function categoryName(category) {
  if (!category) return "Sin categoría";
  if (typeof category === "string") return category;
  return category.name || "Sin categoría";
}

export function customerName(customer) {
  if (!customer) return "Cliente";
  if (typeof customer === "string") return customer;
  return customer.name || "Cliente";
}

export function productName(product) {
  if (!product) return "Producto";
  if (typeof product === "string") return product;
  return product.name || "Producto";
}

export function orderNumber(order) {
  if (!order) return "—";
  if (typeof order === "string") return order;
  return order.orderNumber || "—";
}

export function userName(user) {
  if (!user) return "—";
  return `${user.name || ""} ${user.lastname || ""}`.trim() || user.email || "—";
}
