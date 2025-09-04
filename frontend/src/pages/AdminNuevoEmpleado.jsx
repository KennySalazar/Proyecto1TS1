import { useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function AdminNuevoEmpleado() {
  const { user } = useAuth();
  const [form, setForm] = useState({ nombre:"", correo:"", codigo_empleado:"", password:"" });
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  if (user?.rol !== "ADMINISTRADOR")
    return <div className="container py-4"><div className="alert alert-warning">No autorizado</div></div>;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setRes(null); setLoading(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        codigo_empleado: form.codigo_empleado.trim() || null,
        password: form.password.trim() || undefined,
      };
      const { data } = await api.post("/empleados", payload);
      setRes(data);
      setForm({ nombre:"", correo:"", codigo_empleado:"", password:"" });
    } catch (e) {
      const r = e?.response;
      if (r?.data?.errors) {
        const first = Object.values(r.data.errors).flat()[0];
        setErr(first || "Error de validación");
      } else {
        setErr(r?.data?.message || "No se pudo crear");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0"><i className="bi bi-person-plus me-2"></i>Nuevo empleado</h4>
        <Link to="/admin/empleados" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-list-ul me-1"></i> Lista
        </Link>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          {err && <div className="alert alert-danger">{err}</div>}
          {res && (
            <div className="alert alert-success">
              <i className="bi bi-check-circle me-2"></i>{res.message}.&nbsp;
              {res.password_clara && <>Contraseña: <code>{res.password_clara}</code></>}
            </div>
          )}

          <form onSubmit={onSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombre</label>
              <input className="form-control" name="nombre" value={form.nombre} onChange={onChange} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Correo</label>
              <input className="form-control" name="correo" type="email" value={form.correo} onChange={onChange} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Código empleado (opcional)</label>
              <input className="form-control" name="codigo_empleado" value={form.codigo_empleado} onChange={onChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Contraseña (opcional)</label>
              <input className="form-control" name="password" value={form.password} onChange={onChange} placeholder="vacío = autogenerada" />
            </div>

            <div className="col-12">
              <button className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Creando...</>
                         : <><i className="bi bi-save me-2"></i>Crear</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
