import React, { useEffect, useState } from "react";
import api from "../api/client";
import TicketVenta from "../pages/TicketVenta";

export default function AdminVentas() {
  const [ventas, setVentas] = useState([]);
  const [estado, setEstado] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [empleados, setEmpleados] = useState([]);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [sel, setSel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/empleados", { params: { per_page: 1000 } });
        const list = Array.isArray(data?.data) ? data.data : (data?.empleados ?? []);
        setEmpleados(list.filter(e => e.estado === "ACTIVO"));
      } catch {}
    })();
  }, []);

  const fetchAll = async () => {
    setLoading(true); setErr("");
    try {
      const params = {};
      if (estado)   params.estado = estado;
      if (vendedor) params.vendedor = vendedor;
      if (desde)    params.desde = desde;
      if (hasta)    params.hasta = hasta;
      const { data } = await api.get("/admin/ventas", { params });
      setVentas(data?.ventas ?? []);
    } catch (e) {
      setErr(e?.response?.data?.message || "No se pudieron cargar las ventas.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [estado, vendedor, desde, hasta]);

  return (
    <div className="container py-4">
      <h4 className="mb-3"><i className="bi bi-clipboard-data me-2" />Ventas (admin)</h4>

      <div className="row g-2 mb-3">
        <div className="col-auto">
          <select className="form-select form-select-sm" value={estado} onChange={e=>setEstado(e.target.value)}>
            <option value="">Estado: todos</option>
            <option value="PAGADA">PAGADA</option>
            <option value="CANCELADA">CANCELADA</option>
          </select>
        </div>
        <div className="col-auto">
          <select className="form-select form-select-sm" value={vendedor} onChange={e=>setVendedor(e.target.value)}>
            <option value="">Vendedor: todos</option>
            {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="col-auto">
          <input type="date" className="form-control form-control-sm" value={desde} onChange={e=>setDesde(e.target.value)} />
        </div>
        <div className="col-auto">
          <input type="date" className="form-control form-control-sm" value={hasta} onChange={e=>setHasta(e.target.value)} />
        </div>
      </div>

      {loading && <div className="alert alert-secondary">Cargando…</div>}
      {err && <div className="alert alert-danger">{err}</div>}

      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>#</th><th>Fecha</th><th>Vendedor</th><th>Estado</th><th className="text-end">Total</th><th></th>
            </tr>
          </thead>
          <tbody>
            {ventas.map(v => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{new Date(v.creado_en).toLocaleString()}</td>
                <td>{v.vendedor?.nombre || "-"}</td>
                <td><span className="badge text-bg-secondary">{v.estado}</span></td>
                <td className="text-end">Q {Number(v.total).toFixed(2)}</td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-primary" onClick={()=>setSel(v)}>
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
            {ventas.length === 0 && !loading && !err && (
              <tr><td colSpan="6" className="text-center text-muted">Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {sel && <TicketVenta venta={sel} onClose={()=>setSel(null)} />}
    </div>
  );
}
