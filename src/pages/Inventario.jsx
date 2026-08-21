import { useCallback, useEffect, useState } from "react";
import { Btn, DataTable, EmptyState, Modal, PageHeader } from "../components/ui";
import { ArrowDownToLine, ArrowUpFromLine, Filter, Plus, Save } from "../components/icons";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { api } from "../lib/api";
import { MOVEMENT_TYPE_LABELS } from "../lib/constants";
import { formatDate, productName, userName } from "../lib/format";

const emptyForm = { type: "IN", productId: "", quantity: "", notes: "" };

export default function Inventario() {
  const { can } = useAuth();
  const { showToast, Toast } = useToast();
  const canCreate = can("inventory:create");
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (typeFilter) params.set("type", typeFilter);
      const [movRes, prodRes] = await Promise.all([
        api.get(`/inventory/history?${params.toString()}`),
        api.get("/products?limit=100&sort=name&order=asc"),
      ]);
      setMovements(movRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    const v = {};
    if (!form.productId) v.productId = "Selecciona un producto.";
    if (!form.quantity || Number(form.quantity) < 1) v.quantity = "Ingresa una cantidad válida.";
    setErrors(v);
    if (Object.keys(v).length) return;

    setSaving(true);
    try {
      const path = form.type === "IN" ? "/inventory/in" : "/inventory/out";
      await api.post(path, {
        productId: form.productId,
        quantity: Number(form.quantity),
        notes: form.notes || undefined,
      });
      showToast(form.type === "IN" ? "Entrada registrada." : "Salida registrada.");
      setModalOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  }

  const selected = products.find((p) => p._id === form.productId);

  return (
    <div className="ui-page">
      <PageHeader
        kicker="Kardex"
        title="Inventario"
        lede="Entradas, salidas y el responsable de cada movimiento."
        actions={canCreate && (
          <Btn primary icon={Plus} onClick={() => { setForm(emptyForm); setErrors({}); setModalOpen(true); }}>
            Registrar movimiento
          </Btn>
        )}
      />

      <div className="ui-toolbar">
        <div className="ui-filters">
          <div className="ui-filter-wrap">
            <Filter size={15} strokeWidth={1.75} className="ui-filter-icon" aria-hidden="true" />
            <select className="ui-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filtrar por tipo">
              <option value="">Todos los movimientos</option>
              <option value="IN">Entradas</option>
              <option value="OUT">Salidas</option>
            </select>
          </div>
        </div>
        <span className="ui-meta">{movements.length} movimientos</span>
      </div>

      {loading ? (
        <EmptyState description="Cargando historial…" />
      ) : error ? (
        <EmptyState title="No se pudo cargar" description={error} />
      ) : movements.length > 0 ? (
        <DataTable>
        <table className="ui-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Producto</th>
              <th className="ui-num">Cantidad</th>
              <th className="ui-num">Antes</th>
              <th className="ui-num">Después</th>
              <th>Responsable</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m._id}>
                <td>{formatDate(m.createdAt, true)}</td>
                <td>
                  <span className={`ui-status has-icon ${m.type === "IN" ? "is-ok" : "is-warn"}`}>
                    {m.type === "IN"
                      ? <ArrowDownToLine size={13} strokeWidth={2} aria-hidden="true" />
                      : <ArrowUpFromLine size={13} strokeWidth={2} aria-hidden="true" />}
                    {MOVEMENT_TYPE_LABELS[m.type] || m.type}
                  </span>
                </td>
                <td>
                  <div className="ui-name">{productName(m.productId)}</div>
                  {m.notes && <div className="ui-hint">{m.notes}</div>}
                </td>
                <td className="ui-num">{m.quantity}</td>
                <td className="ui-num">{m.previousStock}</td>
                <td className="ui-num">{m.newStock}</td>
                <td>{userName(m.userId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </DataTable>
      ) : (
        <EmptyState
          title="Aún no hay movimientos"
          description="Las entradas y salidas de stock se listarán aquí."
          action={canCreate ? (
            <Btn primary icon={Plus} onClick={() => { setForm(emptyForm); setErrors({}); setModalOpen(true); }}>
              Registrar movimiento
            </Btn>
          ) : null}
        />
      )}

      {modalOpen && (
        <Modal
          title="Registrar movimiento"
          subtitle="Las entradas suman stock. Las salidas lo descuentan si hay existencias."
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} noValidate>
            {errors.form && <div className="ui-error">{errors.form}</div>}
            <div className="ui-grid-2">
              <div className="ui-field">
                <label>Tipo</label>
                <select className="ui-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="IN">Entrada</option>
                  <option value="OUT">Salida</option>
                </select>
              </div>
              <div className="ui-field">
                <label>Cantidad</label>
                <input className={`ui-input ${errors.quantity ? "is-invalid" : ""}`} type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                {errors.quantity && <div className="ui-error">{errors.quantity}</div>}
              </div>
            </div>
            <div className="ui-field">
              <label>Producto</label>
              <select className={`ui-select ${errors.productId ? "is-invalid" : ""}`} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                <option value="">Selecciona un producto</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.name} · stock {p.stock}</option>)}
              </select>
              {errors.productId && <div className="ui-error">{errors.productId}</div>}
              {selected && <div className="ui-hint">Stock actual: {selected.stock} · mínimo {selected.minimumStock}</div>}
            </div>
            <div className="ui-field">
              <label>Notas</label>
              <textarea className="ui-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Proveedor, motivo de salida, etc." />
            </div>
            <div className="ui-actions">
              <Btn ghost onClick={() => setModalOpen(false)}>Cancelar</Btn>
              <Btn primary type="submit" icon={Save} disabled={saving}>{saving ? "Registrando…" : "Registrar"}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {Toast}
    </div>
  );
}
