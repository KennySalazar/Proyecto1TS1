import { useEffect, useState } from "react";
import api from "../api/client";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminEmpleadosList() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page:1, last_page:1, per_page:10, total:0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchData = async (page=1) => {
    setLoading(true); setErr("");
    try {
      const { data } = await api.get("/empleados", { params: { page, search, per_page: 10 } });
      setRows(data.data);
      setMeta({ ...data, data: undefined });
    } catch (e) {
      setErr("No se pudo cargar la lista");
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ fetchData(1); }, []); // first load
  const onSearch = (e) => { e.preventDefault(); fetchData(1); };

  const actDesEstado = async (id) => {
    if (!confirm("¿Cambiar estado del empleado?")) return;
    try {
      await api.patch(`/empleados/${id}/estado`);
      fetchData(meta.current_page);
    } catch {
      alert("No se pudo actualizar el estado");
    }
  };

  if (user?.rol !== "ADMINISTRADOR")
    return <div className="container py-4"><div className="alert alert-warning">No autorizado</div></div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0"><i className="bi bi-people me-2"></i>Empleados</h4>
        <Link to="/admin/empleados/nuevo" className="btn btn-primary">
          <i className="bi bi-person-plus me-1"></i>Nuevo
        </Link>
      </div>

      <form className="input-group mb-3" onSubmit={onSearch}>
        <span className="input-group-text"><i className="bi bi-search"></i></span>
        <input className="form-control" placeholder="Buscar por nombre, correo, código"
               value={search} onChange={e=>setSearch(e.target.value)} />
        <button className="btn btn-outline-secondary">Buscar</button>
      </form>

      {err && <div className="alert alert-danger">{err}</div>}

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Código</th>
                <th>Estado</th>
                <th style={{width:160}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4">
                  <div className="spinner-border" role="status"></div>
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4">Sin resultados</td></tr>
              ) : rows.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.nombre}</td>
                  <td>{r.correo}</td>
                  <td>{r.codigo_empleado || "-"}</td>
                  <td>
                    <span className={`badge ${r.estado==='ACTIVO'?'bg-success':'bg-secondary'}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-warning"
                            onClick={()=>actDesEstado(r.id)}>
                      <i className="bi bi-person-x me-1"></i>
                      {r.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* paginación simple */}
        <div className="card-footer d-flex justify-content-between align-items-center">
          <span className="text-muted small">
            Página {meta.current_page} de {meta.last_page} · {meta.total} items
          </span>
          <div className="btn-group">
            <button className="btn btn-outline-secondary btn-sm"
                    disabled={meta.current_page<=1}
                    onClick={()=>fetchData(meta.current_page-1)}>
              <i className="bi bi-chevron-left"></i>
            </button>
            <button className="btn btn-outline-secondary btn-sm"
                    disabled={meta.current_page>=meta.last_page}
                    onClick={()=>fetchData(meta.current_page+1)}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
