import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";

export default function LoginPage() {
  const [correo, setCorreo] = useState("admin@example.com");
  const [password, setPassword] = useState("password");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();     // ← usa login del contexto
  const nav = useNavigate();

  if (user) return <Navigate to="/" replace />;   // ← si ya hay sesión, fuera del login

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await login(correo, password);     // ← actualiza token + user en contexto
      nav("/");
    } catch (e) {
      setErr(e?.response?.data?.message || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="d-flex align-items-center justify-content-center min-vh-100 w-100 bg-light">
  <div className="card shadow-sm" style={{ minWidth: 400 }}>
        <div className="card-body p-4">
          <h3 className="mb-4 text-center">
            <i className="bi bi-box-arrow-in-right me-2"></i> Iniciar sesión
          </h3>
          {err && <div className="alert alert-danger">{err}</div>}
          <form onSubmit={onSubmit} className="vstack gap-3">
            <div>
              <label className="form-label">Correo</label>
              <input type="email" className="form-control form-control-lg"
                     value={correo} onChange={e=>setCorreo(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Contraseña</label>
              <input type="password" className="form-control form-control-lg"
                     value={password} onChange={e=>setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-100" disabled={loading}>
              {loading
                ? (<><span className="spinner-border spinner-border-sm me-2"></span>Entrando...</>)
                : (<><i className="bi bi-door-open me-2"></i>Entrar</>)}
            </button>
          </form>
          <p className="text-muted small mt-3 text-center">
            Tip: admin@example.com / password
          </p>
        </div>
      </div>
    </div>
  );
}
