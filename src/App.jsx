import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Productos from "./pages/Productos";
import Inventario from "./pages/Inventario";
import Clientes from "./pages/Clientes";
import Pedidos from "./pages/Pedidos";
import Facturacion from "./pages/Facturacion";
import Usuarios from "./pages/Usuarios";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";

function LoginRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="app-boot">Cargando sesión…</div>;
  }
  if (isAuthenticated) {
    const from = location.state?.from || "/";
    return <Navigate to={from} replace />;
  }
  return <Login />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="productos" element={<ProtectedRoute path="/productos"><Productos /></ProtectedRoute>} />
        <Route path="inventario" element={<ProtectedRoute path="/inventario"><Inventario /></ProtectedRoute>} />
        <Route path="clientes" element={<ProtectedRoute path="/clientes"><Clientes /></ProtectedRoute>} />
        <Route path="pedidos" element={<ProtectedRoute path="/pedidos"><Pedidos /></ProtectedRoute>} />
        <Route path="facturacion" element={<ProtectedRoute path="/facturacion"><Facturacion /></ProtectedRoute>} />
        <Route path="reportes" element={<ProtectedRoute path="/reportes"><Reportes /></ProtectedRoute>} />
        <Route path="usuarios" element={<ProtectedRoute path="/usuarios"><Usuarios /></ProtectedRoute>} />
        <Route path="configuracion" element={<ProtectedRoute path="/configuracion"><Configuracion /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
