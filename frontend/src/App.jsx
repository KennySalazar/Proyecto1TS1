import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import AdminNuevoEmpleado from "./pages/AdminNuevoEmpleado";
import AdminEmpleadosList from "./pages/AdminEmpleadosList";
import AppNavbar from "./components/AppNavbar";
import EmpleadoTareas from "./pages/EmpleadoTareas.jsx";
import AdminNuevoComponente from "./pages/AdminNuevoComponente.jsx";
import AdminNuevaPrearmada from "./pages/AdminNuevaPrearmada.jsx";
import AdminNuevaTarea from "./pages/AdminNuevaTarea.jsx";
import EmpleadoCatalogo from "./pages/EmpleadoCatalogo.jsx";
import EmpleadoVenta from "./pages/EmpleadoVenta.jsx";
import EmpleadoVentas from "./pages/EmpleadoVentas.jsx";
import AdminVentas from "./pages/AdminVentas.jsx";
import EmpleadoPersonalizada from "./pages/EmpleadoPersonalizada.jsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

/* Página de inicio */
function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const isAdmin = user.rol === "ADMINISTRADOR";

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 w-100 bg-light">
      <div className="card shadow-sm" style={{minWidth: 420}}>
        <div className="card-body">
          <h4 className="card-title mb-3">
            <i className="bi bi-house-door me-2" />
            Inicio
          </h4>
          <p className="mb-3">
            Hola, <b>{user.nombre}</b> ({user.rol})
          </p>
        </div>
      </div>
    </div>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppNavbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Home />} />

          {/* Admin: empleados */}
          <Route
            path="/admin/empleados"
            element={
              <PrivateRoute role="ADMINISTRADOR">
                <AdminEmpleadosList />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/empleados/nuevo"
            element={
              <PrivateRoute role="ADMINISTRADOR">
                <AdminNuevoEmpleado />
              </PrivateRoute>
            }
          />

          {/* Empleado: tareas */}
          <Route
            path="/empleado/tareas"
            element={
              <PrivateRoute>
                <EmpleadoTareas />
              </PrivateRoute>
            }
          />

          {/* Admin: catálogos / producción / tareas */}
          <Route
            path="/admin/componentes/nuevo"
            element={
              <PrivateRoute role="ADMINISTRADOR">
                <AdminNuevoComponente />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/prearmadas/nuevo"
            element={
              <PrivateRoute role="ADMINISTRADOR">
                <AdminNuevaPrearmada />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/tareas/nueva"
            element={
              <PrivateRoute role="ADMINISTRADOR">
                <AdminNuevaTarea />
              </PrivateRoute>
            }
          />
          <Route
            path="/empleado/catalogo"
            element={
              <PrivateRoute>
                <EmpleadoCatalogo />
              </PrivateRoute>
            }
          />
          <Route
            path="/empleado/venta"
            element={
              <PrivateRoute>
                <EmpleadoVenta />
              </PrivateRoute>
            }
          />
          <Route
            path="/empleado/ventas"
            element={
              <PrivateRoute>
                <EmpleadoVentas />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/ventas"
            element={
              <PrivateRoute role="ADMINISTRADOR">
                <AdminVentas />
              </PrivateRoute>
            }
          />
          <Route path="/empleado/personalizada" element={
              <PrivateRoute>
                <EmpleadoPersonalizada />
              </PrivateRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}