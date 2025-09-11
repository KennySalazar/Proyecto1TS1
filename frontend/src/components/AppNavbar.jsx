import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (location.pathname === "/login") return null;

  const isAdmin = user?.rol === "ADMINISTRADOR";

  // Menús por rol
  const empleadoTabs = [
    { to: "/empleado/catalogo",     icon: "bi-shop",             text: "Catálogo" },
    { to: "/empleado/tareas",       icon: "bi-clipboard-check",  text: "Mis tareas" },
    { to: "/empleado/venta",        icon: "bi-bag-check",        text: "Vender" },
    { to: "/empleado/personalizada",icon: "bi-pc-display",       text: "PC personalizada" },
    { to: "/empleado/ventas",       icon: "bi-receipt",          text: "Mis ventas" },
  ];

  const adminTabs = [
    { to: "/admin/empleados",          icon: "bi-people",          text: "Empleados" },
    { to: "/admin/componentes/nuevo",  icon: "bi-cpu",             text: "Nuevo componente" },
    { to: "/admin/prearmadas/nuevo",   icon: "bi-pc",              text: "Nueva prearmada" },
    { to: "/admin/tareas/nueva",       icon: "bi-clipboard-plus",  text: "Nueva tarea" },
    { to: "/admin/ventas",             icon: "bi-clipboard-data",  text: "Ventas (admin)" },
  ];

  const tabs = isAdmin ? adminTabs : empleadoTabs;

  return (
    <>
      {/* Barra superior */}
      <nav className="navbar navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <i className="bi bi-cpu me-2" />
            Venta y Ensamblaje de Computadoras
          </Link>

          <div className="d-flex align-items-center gap-2">
            {user && (
              <span className="text-white-50 me-2 small">
                {user.nombre} · {user.rol}
              </span>
            )}
            {user ? (
              <button className="btn btn-outline-light btn-sm" onClick={logout}>
                <i className="bi bi-box-arrow-right me-1" /> Salir
              </button>
            ) : (
              <Link className="btn btn-outline-light btn-sm" to="/login">Entrar</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Sub-barra con tabs por rol */}
      {user && (
        <div className="bg-light border-bottom">
          <div className="container">
            <ul className="nav nav-pills py-2 flex-wrap">
              {tabs.map(({ to, icon, text }) => (
                <li className="nav-item me-2 mb-2" key={to}>
                  <NavLink
                    to={to}
                    end
                    className={({ isActive }) =>
                      "nav-link " + (isActive ? "active" : "link-dark")
                    }
                  >
                    <i className={`bi ${icon} me-1`} /> {text}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
