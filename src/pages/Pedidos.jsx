import { useCallback, useEffect, useState } from "react";
import { Btn, DataTable, IconBtn, OrderStatus, SearchInput } from "../components/ui";
import { Eye, Filter, ORDER_STATUS_ICONS, Plus, Save, Trash2, X } from "../components/icons";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { ORDER_STATUS_LABELS } from "../lib/constants";
import { customerName, formatCOP, formatDate, productName } from "../lib/format";

const ESTADOS = Object.keys(ORDER_STATUS_LABELS);

function getStockIssues(items) {
  const issues = [];
  for (const item of items || []) {
    const product = item.productId;
    if (!product || typeof product === "string") continue;
    const available = product.stock ?? 0;
    if (item.quantity > available) {
      issues.push({ name: product.name, needed: item.quantity, available });
    }
  }
  return issues;
}

function getNextStatus(current) {
  const index = ESTADOS.indexOf(current);
  return index >= 0 && index < ESTADOS.length - 1 ? ESTADOS[index + 1] : null;
}

function emptyItem() {
  return { productId: "", quantity: "" };
}

function emptyForm() {
  return { customerId: "", deliveryDate: "", notes: "", items: [emptyItem()] };
}

export default function Pedidos() {
  const { can } = useAuth();
  const canCreate = can("orders:create");
  const canUpdate = can("orders:update");

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [detail, setDetail] = useState(null);
  const [linkedInvoice, setLinkedInvoice] = useState(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (query.trim()) params.set("search", query.trim());
      if (estadoFilter) params.set("status", estadoFilter);
      const [orderRes, customerRes, productRes] = await Promise.all([
        api.get(`/orders?${params.toString()}`),
        api.get("/customers?limit=100&sort=name&order=asc"),
        api.get("/products?limit=100&sort=name&order=asc"),
      ]);
      setOrders(orderRes.data || []);
      setCustomers(customerRes.data || []);
      setProducts(productRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, estadoFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  }

  function updateItem(index, field, value) {
    setForm((f) => {
      const items = [...f.items];
      items[index] = { ...items[index], [field]: value };
      return { ...f, items };
    });
  }

  function validate(f) {
    const e = {};
    if (!f.customerId) e.customerId = "Selecciona un cliente.";
    if (!f.deliveryDate) e.deliveryDate = "Indica la fecha de entrega.";
    const validItems = f.items.filter((item) => item.productId && Number(item.quantity) > 0);
    if (validItems.length === 0) e.items = "Agrega al menos un producto con cantidad.";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSaving(true);
    try {
      await api.post("/orders", {
        customerId: form.customerId,
        deliveryDate: form.deliveryDate,
        notes: form.notes || undefined,
        items: form.items
          .filter((item) => item.productId && Number(item.quantity) > 0)
          .map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })),
      });
      showToast("Pedido creado correctamente.");
      setCreateOpen(false);
      await load();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function loadLinkedInvoice(orderId) {
    try {
      const res = await api.get(`/invoices?orderId=${orderId}&limit=1`);
      setLinkedInvoice((res.data || [])[0] || null);
    } catch {
      setLinkedInvoice(null);
    }
  }

  async function openOrderDetail(order) {
    try {
      const res = await api.get(`/orders/${order._id}`);
      setDetail(res.data);
      if (res.data.status !== "PENDING") {
        await loadLinkedInvoice(order._id);
      } else {
        setLinkedInvoice(null);
      }
    } catch (err) {
      showToast(err.message);
    }
  }

  async function changeStatus(order, status) {
    if (status === "IN_PROCESS") {
      const issues = getStockIssues(order.items);
      if (issues.length > 0) {
        showToast("Stock insuficiente. Registra entradas en Inventario antes de procesar el pedido.");
        return;
      }
    }

    try {
      await api.put(`/orders/${order._id}`, { status });
      const msg = status === "IN_PROCESS"
        ? "Pedido en proceso. Factura generada automáticamente."
        : `Estado actualizado a ${ORDER_STATUS_LABELS[status]}.`;
      showToast(msg);
      const res = await api.get(`/orders/${order._id}`);
      setDetail(res.data);
      if (status === "IN_PROCESS" || res.data.status !== "PENDING") {
        await loadLinkedInvoice(order._id);
      }
      await load();
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <div className="ui-page">
      <header className="ui-head">
        <div>
          <p className="ui-kicker">Seguimiento</p>
          <h2 className="ui-title">Pedidos</h2>
          <p className="ui-lede">Pendiente, en proceso, completado y entregado.</p>
        </div>
        {canCreate && (
          <Btn primary icon={Plus} onClick={() => { setForm(emptyForm()); setErrors({}); setCreateOpen(true); }}>
            Nuevo pedido
          </Btn>
        )}
      </header>

      <div className="ui-toolbar">
        <div className="ui-filters">
          <SearchInput
            placeholder="Buscar por número o cliente"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="ui-filter-wrap">
            <Filter size={15} strokeWidth={1.75} className="ui-filter-icon" aria-hidden="true" />
            <select className="ui-select" value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            {ESTADOS.map((status) => <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>)}
            </select>
          </div>
        </div>
        <span className="ui-meta">{orders.length} pedidos</span>
      </div>

      {loading ? (
        <div className="ui-empty">Cargando pedidos…</div>
      ) : error ? (
        <div className="ui-empty"><strong>No se pudo cargar</strong>{error}</div>
      ) : orders.length > 0 ? (
        <DataTable>
        <table className="ui-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Entrega</th>
              <th>Estado</th>
              <th className="ui-num">Total</th>
              <th className="ui-num ui-actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td className="ui-name">{o.orderNumber}</td>
                <td>{customerName(o.customerId)}</td>
                <td>{formatDate(o.deliveryDate)}</td>
                <td>
                  <OrderStatus status={o.status} />
                </td>
                <td className="ui-num">{formatCOP(o.total)}</td>
                <td>
                  <div className="ui-row-actions">
                    <IconBtn icon={Eye} label="Ver detalle del pedido" onClick={() => openOrderDetail(o)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </DataTable>
      ) : (
        <div className="ui-empty">
          <strong>No hay pedidos pendientes</strong>
          Cuando se registre un nuevo pedido aparecerá aquí.
          {canCreate && (
            <p className="db-empty-action">
              <Btn primary icon={Plus} onClick={() => { setForm(emptyForm()); setErrors({}); setCreateOpen(true); }}>Crear pedido</Btn>
            </p>
          )}
        </div>
      )}

      {createOpen && (
        <div className="ui-overlay" onClick={() => setCreateOpen(false)}>
          <div className="ui-modal is-wide" onClick={(e) => e.stopPropagation()}>
            <div className="ui-modal-head">
              <div>
                <h2>Nuevo pedido</h2>
                <p>Asocia cliente, fecha de entrega y productos.</p>
              </div>
              <button type="button" className="ui-close" onClick={() => setCreateOpen(false)} aria-label="Cerrar">
                <X size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              {errors.form && <div className="ui-error">{errors.form}</div>}
              <div className="ui-grid-2">
                <div className="ui-field">
                  <label>Cliente</label>
                  <select className="ui-select" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                    <option value="">Selecciona un cliente</option>
                    {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  {errors.customerId && <div className="ui-error">{errors.customerId}</div>}
                </div>
                <div className="ui-field">
                  <label>Fecha de entrega</label>
                  <input className="ui-input" type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} />
                  {errors.deliveryDate && <div className="ui-error">{errors.deliveryDate}</div>}
                </div>
              </div>
              <div className="ui-field">
                <label>Notas</label>
                <textarea className="ui-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="ui-field">
                <label>Productos</label>
                {form.items.map((item, index) => (
                  <div key={index} className="ui-item-row">
                    <select className="ui-select" value={item.productId} onChange={(e) => updateItem(index, "productId", e.target.value)}>
                      <option value="">Producto</option>
                      {products.map((p) => <option key={p._id} value={p._id}>{p.name} · stock {p.stock}</option>)}
                    </select>
                    <input className="ui-input" type="number" min="1" placeholder="Cant." value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} />
                    {form.items.length > 1 && (
                      <IconBtn icon={Trash2} label="Quitar producto" danger onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }))} />
                    )}
                  </div>
                ))}
                <Btn ghost icon={Plus} onClick={() => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }))}>Agregar producto</Btn>
                {errors.items && <div className="ui-error">{errors.items}</div>}
              </div>
              <div className="ui-actions">
                <Btn ghost onClick={() => setCreateOpen(false)}>Cancelar</Btn>
                <Btn primary type="submit" icon={Save} disabled={saving}>{saving ? "Creando…" : "Crear pedido"}</Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {detail && (() => {
        const stockIssues = detail.status === "PENDING" ? getStockIssues(detail.items) : [];
        const nextStatus = getNextStatus(detail.status);
        const blockInProcess = nextStatus === "IN_PROCESS" && stockIssues.length > 0;

        return (
        <div className="ui-overlay" onClick={() => setDetail(null)}>
          <div className="ui-modal is-wide" onClick={(e) => e.stopPropagation()}>
            <div className="ui-modal-head">
              <div>
                <div className="ui-modal-title-row">
                  <h2>{detail.orderNumber}</h2>
                  <OrderStatus status={detail.status} />
                </div>
                <p>{customerName(detail.customerId)} · creado {formatDate(detail.createdAt)}</p>
              </div>
              <button type="button" className="ui-close" onClick={() => setDetail(null)} aria-label="Cerrar">
                <X size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <div className="ui-progress">
              {ESTADOS.map((status, index) => {
                const StepIcon = ORDER_STATUS_ICONS[status];
                return (
                  <div
                    key={status}
                    className={`ui-progress-step has-icon ${ESTADOS.indexOf(detail.status) >= index ? "is-done" : ""} ${detail.status === status ? "is-current" : ""}`}
                  >
                    {StepIcon && <StepIcon size={14} strokeWidth={1.75} aria-hidden="true" />}
                    {ORDER_STATUS_LABELS[status]}
                  </div>
                );
              })}
            </div>
            <dl className="ui-dl">
              <div>
                <dt>Entrega</dt>
                <dd>{formatDate(detail.deliveryDate)}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{formatCOP(detail.total)}</dd>
              </div>
              {linkedInvoice && (
                <div>
                  <dt>Factura</dt>
                  <dd>{linkedInvoice.invoiceNumber} · {formatCOP(linkedInvoice.total)}</dd>
                </div>
              )}
            </dl>
            {detail.status === "PENDING" && (
              <p className="ui-hint ui-order-hint">
                Al marcar &quot;En proceso&quot; se generará la factura y se descontará el inventario.
              </p>
            )}
            {blockInProcess && (
              <div className="ui-alert ui-order-stock-alert" role="alert">
                <strong>Stock insuficiente para procesar este pedido.</strong>
                <span> Registra entradas en Inventario y vuelve a intentarlo.</span>
                <ul>
                  {stockIssues.map((issue) => (
                    <li key={issue.name}>
                      {issue.name}: pedido {issue.needed} · disponible {issue.available}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="ui-order-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="ui-num">Cant.</th>
                  {detail.status === "PENDING" && <th className="ui-num">Stock</th>}
                  <th className="ui-num">Precio</th>
                </tr>
              </thead>
              <tbody>
                {(detail.items || []).map((item, i) => {
                  const stock = typeof item.productId === "object" ? item.productId?.stock : null;
                  const lowStock = detail.status === "PENDING" && stock != null && item.quantity > stock;
                  return (
                    <tr key={i}>
                      <td>{productName(item.productId)}</td>
                      <td className="ui-num">{item.quantity}</td>
                      {detail.status === "PENDING" && (
                        <td className={`ui-num${lowStock ? " is-low-stock" : ""}`}>{stock ?? "—"}</td>
                      )}
                      <td className="ui-num">{formatCOP(item.price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            {canUpdate && detail.status !== "DELIVERED" && nextStatus && (
              <div className="ui-actions">
                <Btn
                  ghost
                  icon={ORDER_STATUS_ICONS[nextStatus]}
                  disabled={blockInProcess}
                  onClick={() => changeStatus(detail, nextStatus)}
                >
                  Marcar {ORDER_STATUS_LABELS[nextStatus]}
                </Btn>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {toast && <div className="ui-toast">{toast}</div>}
    </div>
  );
}
