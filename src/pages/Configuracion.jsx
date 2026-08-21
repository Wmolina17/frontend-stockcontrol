import { useState } from "react";
import { Btn, PageHeader } from "../components/ui";
import { Save } from "../components/icons";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { api } from "../lib/api";
import { ROLES } from "../lib/constants";

export default function Configuracion() {
  const { user } = useAuth();
  const { showToast, Toast } = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const v = {};
    if (form.currentPassword.length < 6) v.currentPassword = "Ingresa tu contraseña actual.";
    if (form.newPassword.length < 6) v.newPassword = "La nueva contraseña debe tener mínimo 6 caracteres.";
    if (form.newPassword !== form.confirm) v.confirm = "Las contraseñas no coinciden.";
    setErrors(v);
    if (Object.keys(v).length) return;

    setSaving(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      showToast("Contraseña actualizada. Úsala en el próximo inicio de sesión.");
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ui-page">
      <PageHeader
        kicker="Cuenta"
        title="Configuración"
        lede="Tu perfil y la seguridad de la cuenta."
      />

      <section className="ui-section">
        <h2>Perfil</h2>
        <dl className="ui-dl">
          <div>
            <dt>Nombre</dt>
            <dd>{user.nombre} {user.apellido}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd>{user.correo}</dd>
          </div>
          <div>
            <dt>Rol</dt>
            <dd>{ROLES[user.role] || user.rol}</dd>
          </div>
        </dl>
      </section>

      <section className="ui-section">
        <h2>Cambiar contraseña</h2>
        <form onSubmit={handleSubmit} noValidate>
          {errors.form && <div className="ui-error">{errors.form}</div>}
          <div className="ui-field">
            <label>Contraseña actual</label>
            <input type="password" className={`ui-input ${errors.currentPassword ? "is-invalid" : ""}`} value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
            {errors.currentPassword && <div className="ui-error">{errors.currentPassword}</div>}
          </div>
          <div className="ui-grid-2">
            <div className="ui-field">
              <label>Nueva contraseña</label>
              <input type="password" className={`ui-input ${errors.newPassword ? "is-invalid" : ""}`} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
              {errors.newPassword && <div className="ui-error">{errors.newPassword}</div>}
            </div>
            <div className="ui-field">
              <label>Confirmar</label>
              <input type="password" className={`ui-input ${errors.confirm ? "is-invalid" : ""}`} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
              {errors.confirm && <div className="ui-error">{errors.confirm}</div>}
            </div>
          </div>
          <div className="ui-actions">
            <Btn primary type="submit" icon={Save} disabled={saving}>{saving ? "Actualizando…" : "Actualizar contraseña"}</Btn>
          </div>
        </form>
      </section>

      {Toast}
    </div>
  );
}
