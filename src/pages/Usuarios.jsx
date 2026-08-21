import { useCallback, useEffect, useState } from "react";
import { Btn, DataTable, IconBtn, PassToggle, SearchInput } from "../components/ui";
import { Filter, Pencil, Plus, Save, Trash2, X } from "../components/icons";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { ROLE_COLORS, ROLES } from "../lib/constants";

function emptyForm() {
  return { id: null, name: "", lastname: "", email: "", password: "", role: "SELLER", isActive: true };
}

function initials(name = "", lastname = "") {
  return `${(name[0] || "").toUpperCase()}${(lastname[0] || "").toUpperCase()}` || "US";
}

export default function Usuarios() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [toast, setToast] = useState("");

  const isEditing = Boolean(form.id);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100", sort: "name", order: "asc" });
      if (query.trim()) params.set("search", query.trim());
      const res = await api.get(`/users?${params.toString()}`);
      const list = res.data || [];
      setUsers(roleFilter ? list.filter((u) => u.role === roleFilter) : list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  }

  function openCreate() {
    setForm(emptyForm());
    setErrors({});
    setShowPass(false);
    setModalOpen(true);
  }

  function openEdit(user) {
    setForm({
      id: user._id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.isActive,
    });
    setErrors({});
    setShowPass(false);
    setModalOpen(true);
  }

  function validate(f) {
    const e = {};
    if (!f.name.trim()) e.name = "El nombre es obligatorio.";
    if (!f.lastname.trim()) e.lastname = "El apellido es obligatorio.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Ingresa un correo válido.";
    if (!isEditing && (!f.password || f.password.length < 6)) e.password = "La contraseña debe tener mínimo 6 caracteres.";
    if (isEditing && f.password && f.password.length < 6) e.password = "La nueva contraseña debe tener mínimo 6 caracteres.";
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
        lastname: form.lastname.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        isActive: form.isActive,
      };
      if (form.password) payload.password = form.password;
      if (isEditing) {
        await api.put(`/users/${form.id}`, payload);
        showToast("Usuario actualizado correctamente.");
      } else {
        await api.post("/users", payload);
        showToast("Usuario creado. Ya puede iniciar sesión.");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user) {
    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      showToast(user.isActive ? "Usuario desactivado." : "Usuario activado.");
      await load();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function confirmDelete(id) {
    try {
      await api.delete(`/users/${id}`);
      setConfirmDeleteId(null);
      showToast("Usuario eliminado.");
      await load();
    } catch (err) {
      showToast(err.message);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="ui-page">
      <header className="ui-head">
        <div>
          <p className="ui-kicker">Acceso</p>
          <h2 className="ui-title">Usuarios</h2>
          <p className="ui-lede">Cuentas, roles y estado de acceso al sistema.</p>
        </div>
        <Btn primary icon={Plus} onClick={openCreate}>Nuevo usuario</Btn>
      </header>

      <div className="ui-toolbar">
        <div className="ui-filters">
          <SearchInput
            placeholder="Buscar por nombre o correo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="ui-filter-wrap">
            <Filter size={15} strokeWidth={1.75} className="ui-filter-icon" aria-hidden="true" />
            <select className="ui-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filtrar por rol">
            <option value="">Todos los roles</option>
            {Object.entries(ROLES).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </div>
        </div>
        <span className="ui-meta">{users.length} usuarios</span>
      </div>

      {loading ? (
        <div className="ui-empty">Cargando usuarios…</div>
      ) : error ? (
        <div className="ui-empty"><strong>No se pudo cargar</strong>{error}</div>
      ) : users.length > 0 ? (
        <DataTable>
        <table className="ui-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th className="ui-num ui-actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>
                  <div className="ui-person">
                    <div className="ui-avatar">{initials(u.name, u.lastname)}</div>
                    <div>
                      <div className="ui-name">{u.name} {u.lastname}</div>
                      <div className="ui-hint">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`ui-status ${ROLE_COLORS[u.role] || "is-muted"}`}>
                    {ROLES[u.role] || u.role}
                  </span>
                </td>
                <td>
                  <button
                    className="ui-status-btn"
                    onClick={() => toggleActive(u)}
                    disabled={u._id === currentUser.id}
                  >
                    <span className={`ui-status ${u.isActive ? "is-ok" : "is-muted"}`}>
                      {u.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </button>
                </td>
                <td>
                  <div className="ui-row-actions">
                    <IconBtn icon={Pencil} label="Editar usuario" onClick={() => openEdit(u)} />
                    {u._id !== currentUser.id && (
                      <IconBtn icon={Trash2} label="Eliminar usuario" danger onClick={() => setConfirmDeleteId(u._id)} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </DataTable>
      ) : (
        <div className="ui-empty">
          <strong>No hay usuarios</strong>
          Crea una cuenta para que otra persona pueda entrar al sistema.
          <p className="db-empty-action"><Btn primary icon={Plus} onClick={openCreate}>Crear usuario</Btn></p>
        </div>
      )}

      {modalOpen && (
        <div className="ui-overlay" onClick={() => setModalOpen(false)}>
          <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ui-modal-head">
              <div>
                <h2>{isEditing ? "Editar usuario" : "Nuevo usuario"}</h2>
                <p>{isEditing ? "La contraseña es opcional al editar." : "El usuario podrá iniciar sesión de inmediato."}</p>
              </div>
              <button type="button" className="ui-close" onClick={() => setModalOpen(false)} aria-label="Cerrar">
                <X size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              {errors.form && <div className="ui-error">{errors.form}</div>}
              <div className="ui-grid-2">
                <div className="ui-field">
                  <label>Nombre</label>
                  <input className={`ui-input ${errors.name ? "is-invalid" : ""}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  {errors.name && <div className="ui-error">{errors.name}</div>}
                </div>
                <div className="ui-field">
                  <label>Apellido</label>
                  <input className={`ui-input ${errors.lastname ? "is-invalid" : ""}`} value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} />
                  {errors.lastname && <div className="ui-error">{errors.lastname}</div>}
                </div>
              </div>
              <div className="ui-field">
                <label>Correo</label>
                <input type="email" className={`ui-input ${errors.email ? "is-invalid" : ""}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                {errors.email && <div className="ui-error">{errors.email}</div>}
              </div>
              <div className="ui-field">
                <label>Contraseña {isEditing && <span className="ui-hint">(opcional)</span>}</label>
                <div className="ui-pass">
                  <input type={showPass ? "text" : "password"} className={`ui-input ${errors.password ? "is-invalid" : ""}`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <PassToggle show={showPass} onToggle={() => setShowPass((v) => !v)} />
                </div>
                {errors.password && <div className="ui-error">{errors.password}</div>}
              </div>
              <div className="ui-field">
                <label>Rol</label>
                <select className="ui-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {Object.entries(ROLES).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                </select>
              </div>
              <label className="ui-check">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Cuenta activa
              </label>
              <div className="ui-actions">
                <Btn ghost onClick={() => setModalOpen(false)}>Cancelar</Btn>
                <Btn primary type="submit" icon={Save} disabled={saving}>{saving ? "Guardando…" : isEditing ? "Guardar" : "Crear usuario"}</Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="ui-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="ui-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="ui-title">¿Eliminar usuario?</h2>
            <p className="ui-lede">La cuenta se desactivará y no podrá iniciar sesión.</p>
            <div className="ui-actions">
              <Btn ghost onClick={() => setConfirmDeleteId(null)}>Cancelar</Btn>
              <Btn danger icon={Trash2} onClick={() => confirmDelete(confirmDeleteId)}>Eliminar</Btn>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="ui-toast">{toast}</div>}
    </div>
  );
}
