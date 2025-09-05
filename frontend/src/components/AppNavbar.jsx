import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (location.pathname === "/login") return null;

  return (
    <nav className="navbar navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-cpu me-2" /> Venta y Ensamblaje de Computadoras
        </Link>

        <div className="d-flex align-items-center gap-3">
          {user && user.rol !== "ADMINISTRADOR" && (
            <>
              <Link to="/empleado/catalogo" className="nav-link">
                <i className="bi bi-shop me-1" /> Catálogo
              </Link>
              <Link to="/empleado/tareas" className="nav-link">
                <i className="bi bi-clipboard-check me-1" /> Mis tareas
              </Link>
            </>
          )}
          {user ? (
            <button className="btn btn-outline-light btn-sm" onClick={logout}>
              <i className="bi bi-box-arrow-right me-1" /> Salir
            </button>
          ) : (
            location.pathname !== "/login" && (
              <Link className="btn btn-outline-light btn-sm" to="/login">
                Entrar
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
