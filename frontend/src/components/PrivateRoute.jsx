import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children, role, admin }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const isAdmin = user?.rol === "ADMINISTRADOR";
  // soporta ambos: role="ADMINISTRADOR" o admin={true}
  if ((admin || role === "ADMINISTRADOR") && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}
