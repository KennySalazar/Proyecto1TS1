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

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

/* Página de inicio */
function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

    if (user.rol !== "ADMINISTRADOR") {
    return <Navigate to="/empleado/tareas" replace />;
  }

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 w-100 bg-light">
      <div className="card shadow-sm">
        <div className="card-body">
          <h4 className="card-title mb-3">
            <i className="bi bi-house-door me-2" />
            Inicio
          </h4>
          <p className="mb-0">
            Hola, <b>{user.nombre}</b> ({user.rol})
          </p>

          {user.rol === "ADMINISTRADOR" && (
            <div className="mt-3 d-flex flex-wrap gap-2">
              <Link to="/admin/empleados" className="btn btn-outline-secondary">
                <i className="bi bi-list-ul me-1" /> Ver empleados
              </Link>
              <Link to="/admin/empleados/nuevo" className="btn btn-primary">
                <i className="bi bi-person-plus me-1" /> Crear empleado
              </Link>
              <Link to="/admin/componentes/nuevo" className="btn btn-outline-primary">
                <i className="bi bi-cpu me-1" /> Nuevo componente
              </Link>
              <Link to="/admin/prearmadas/nuevo" className="btn btn-outline-primary">
                <i className="bi bi-pc me-1" /> Nueva prearmada
              </Link>
              <Link to="/admin/tareas/nueva" className="btn btn-outline-primary">
                <i className="bi bi-clipboard-plus me-1" /> Nueva tarea
              </Link>
            </div>
          )}
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
