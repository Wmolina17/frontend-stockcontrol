import { useCallback, useEffect, useState } from "react";
import { Btn, ConfirmDialog, DataTable, EmptyState, IconBtn, Modal, PageHeader, SearchInput } from "../components/ui";
import { Pencil, Plus, Save, Trash2 } from "../components/icons";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { api } from "../lib/api";

function emptyForm() {
  return { id: null, name: "", phone: "", address: "", email: "" };
}

export default function Clientes() {
  const { can } = useAuth();
  const { showToast, Toast } = useToast();
  const canCreate = can("customers:create");
  const canUpdate = can("customers:update");

  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const isEditing = Boolean(form.id);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100", sort: "name", order: "asc" });
      if (query.trim()) params.set("search", query.trim());
      const res = await api.get(`/customers?${params.toString()}`);
      setClients(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  function openCreate() {
    setForm(emptyForm());
    setErrors({});
    setPanelOpen(true);
  }

  function openEdit(client) {
    setForm({
      id: client._id,
      name: client.name,
      phone: client.phone,
      address: client.address,
      email: client.email,
    });
    setErrors({});
    setPanelOpen(true);
  }

  function validate(f) {
    const e = {};
    if (!f.name.trim()) e.name = "El nombre es obligatorio.";
    if (!f.phone.trim()) e.phone = "El teléfono es obligatorio.";
    else if (!/^[+()\d\s-]{7,}$/.test(f.phone)) e.phone = "Formato de teléfono no válido.";
    if (!f.address.trim() || f.address.trim().length < 5) e.address = "La dirección es obligatoria.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Ingresa un correo válido.";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        email: form.email.trim().toLowerCase(),
      };
      if (isEditing) {
        await api.put(`/customers/${form.id}`, payload);
        showToast("Cliente actualizado correctamente.");
      } else {
        await api.post("/customers", payload);
        showToast("Cliente creado correctamente.");
      }
      setPanelOpen(false);
      await load();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(id) {
    try {
      await api.delete(`/customers/${id}`);
      setConfirmDeleteId(null);
      showToast("Cliente eliminado.");
      await load();
    } catch (err) {
      showToast(err.message);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="ui-page">
      <PageHeader
        kicker="Directorio"
        title="Clientes"
        lede="Nombre, teléfono, dirección y correo para pedidos y facturación."
        actions={canCreate && <Btn primary icon={Plus} onClick={openCreate}>Nuevo cliente</Btn>}
      />

      <div className="ui-toolbar">
        <div className="ui-filters">
          <SearchInput
            placeholder="Buscar por nombre, correo o teléfono"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="ui-meta">{clients.length} clientes</span>
      </div>

      {loading ? (
        <EmptyState description="Cargando clientes…" />
      ) : error ? (
        <EmptyState title="No se pudo cargar" description={error} />
      ) : clients.length > 0 ? (
        <DataTable>
        <table className="ui-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th className="ui-num ui-actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c._id}>
                <td className="ui-name">{c.name}</td>
                <td>{c.email || "—"}</td>
                <td>{c.phone || "—"}</td>
                <td>{c.address || "—"}</td>
                <td>
                  <div className="ui-row-actions">
                    {canUpdate && <IconBtn icon={Pencil} label="Editar cliente" onClick={() => openEdit(c)} />}
                    {canUpdate && <IconBtn icon={Trash2} label="Eliminar cliente" danger onClick={() => setConfirmDeleteId(c._id)} />}
                    {!canUpdate && <span className="ui-hint">Consulta</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </DataTable>
      ) : (
        <EmptyState
          title="No hay clientes"
          description={query ? `Ningún resultado para “${query}”.` : "Cuando se registre un cliente aparecerá aquí."}
          action={canCreate && !query ? <Btn primary icon={Plus} onClick={openCreate}>Crear cliente</Btn> : null}
        />
      )}

      {panelOpen && (
        <Modal
          title={isEditing ? "Editar cliente" : "Nuevo cliente"}
          subtitle={isEditing ? "Actualiza los datos de contacto." : "Completa los datos del cliente."}
          onClose={() => setPanelOpen(false)}
        >
          <form onSubmit={handleSubmit} noValidate>
            {errors.form && <div className="ui-error">{errors.form}</div>}
            <div className="ui-field">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" className={`ui-input ${errors.name ? "is-invalid" : ""}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <div className="ui-error">{errors.name}</div>}
            </div>
            <div className="ui-field">
              <label htmlFor="email">Correo</label>
              <input id="email" type="email" className={`ui-input ${errors.email ? "is-invalid" : ""}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors.email && <div className="ui-error">{errors.email}</div>}
            </div>
            <div className="ui-grid-2">
              <div className="ui-field">
                <label htmlFor="telefono">Teléfono</label>
                <input id="telefono" className={`ui-input ${errors.phone ? "is-invalid" : ""}`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                {errors.phone && <div className="ui-error">{errors.phone}</div>}
              </div>
              <div className="ui-field">
                <label htmlFor="direccion">Dirección</label>
                <input id="direccion" className={`ui-input ${errors.address ? "is-invalid" : ""}`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                {errors.address && <div className="ui-error">{errors.address}</div>}
              </div>
            </div>
            <div className="ui-actions">
              <Btn ghost onClick={() => setPanelOpen(false)}>Cancelar</Btn>
              <Btn primary type="submit" icon={Save} disabled={saving}>
                {saving ? "Guardando…" : isEditing ? "Guardar" : "Crear cliente"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title="¿Eliminar cliente?"
          description="Se desactivará y dejará de aparecer en los listados."
          confirmLabel="Eliminar"
          danger
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={() => confirmDelete(confirmDeleteId)}
        />
      )}

      {Toast}
    </div>
  );
}
