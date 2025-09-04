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
          {user && (
            <span className="text-light small">
              <i className="bi bi-person-circle me-1" />
              {user.nombre} ({user.rol})
            </span>
          )}

          {user ? (
            <button className="btn btn-outline-light btn-sm" onClick={logout}>
              <i className="bi bi-box-arrow-right me-1" /> Salir
            </button>
          ) : (
            // Ocultar botón si ya estás en /login
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
