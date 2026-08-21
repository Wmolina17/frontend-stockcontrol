import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { DEMO_ACCOUNTS } from "../lib/constants";
import { PassToggle } from "../components/ui";
import { LogIn } from "../components/icons";
import Logo from "../components/Logo";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid || password.length < 6) {
      setError("Completa correo y contraseña (mínimo 6 caracteres).");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password, remember);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setForgotMsg("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotMsg("Ingresa un correo válido.");
      return;
    }
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
      setForgotMsg("Si el correo existe, enviaremos las instrucciones de restablecimiento.");
    } catch (err) {
      setForgotMsg(err.message);
    }
  }

  function fillDemo(account) {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  }

  return (
    <div className="lg">
      <aside className="lg-aside">
        <Logo size={38} />
        <h1>Inventario, pedidos y ventas en un solo lugar.</h1>
        <p>Sistema de gestión para controlar existencias, pedidos, clientes y facturación.</p>
        <p className="lg-team">William Molina · Davanis Barrera · Nicolas Castro</p>
      </aside>

      <main className="lg-main">
        <div className="lg-card">
          <p className="ui-kicker">Acceso</p>
          <h2>Iniciar sesión</h2>
          <p className="ui-lede">Usa tu correo corporativo para continuar.</p>

          {error && <div className="lg-error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="ui-field">
              <label htmlFor="email">Correo</label>
              <input id="email" className="ui-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </div>
            <div className="ui-field">
              <label htmlFor="password">Contraseña</label>
              <div className="lg-pass">
                <input
                  id="password"
                  className="ui-input"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <PassToggle show={showPass} onToggle={() => setShowPass((v) => !v)} />
              </div>
            </div>
            <div className="lg-row">
              <label className="lg-check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Recordarme
              </label>
              <button type="button" className="ui-btn-text" onClick={() => setForgotOpen((v) => !v)}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <button type="submit" className="ui-btn ui-btn-primary lg-submit has-icon" disabled={loading}>
              <LogIn size={16} strokeWidth={1.75} aria-hidden="true" />
              {loading ? "Ingresando…" : "Entrar"}
            </button>
          </form>

          {forgotOpen && (
            <form className="lg-forgot" onSubmit={handleForgot}>
              <div className="ui-field">
                <label htmlFor="forgotEmail">Correo de recuperación</label>
                <input id="forgotEmail" className="ui-input" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
              </div>
              {forgotMsg && <p className="ui-hint">{forgotMsg}</p>}
              <button type="submit" className="ui-btn ui-btn-ghost">Enviar instrucciones</button>
            </form>
          )}

          <div className="lg-demo">
            <p className="ui-kicker">Cuentas de prueba</p>
            {DEMO_ACCOUNTS.map((account) => (
              <button key={account.email} type="button" className="lg-demo-btn" onClick={() => fillDemo(account)}>
                <span>{account.name}</span>
                <span>{account.role}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
