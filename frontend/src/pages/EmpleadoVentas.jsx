import React, { useEffect, useState, useMemo } from "react";
import api from "../api/client";
import TicketVenta from "../pages/TicketVenta";

export default function EmpleadoVentas() {
  const [ventas, setVentas] = useState([]);
  const [estado, setEstado] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sel, setSel] = useState(null);
  

  const fetchAll = async () => {
    setLoading(true); setErr("");
    try {
      const params = {};
      if (estado) params.estado = estado;
      if (desde)  params.desde  = desde;
      if (hasta)  params.hasta  = hasta;
      const { data } = await api.get("/ventas", { params });
      setVentas(data?.ventas ?? []);
    } catch (e) {
      setErr(e?.response?.data?.message || "No se pudieron cargar tus ventas.");
    } finally { setLoading(false); }
  };

 
useEffect(() => { fetchAll(); }, [estado, desde, hasta]);

  const total = useMemo(() => ventas.length, [ventas]);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <h4 className="mb-0"><i className="bi bi-bag-check me-2" />Mis ventas</h4>

        <select className="form-select form-select-sm" style={{width:160}} value={estado} onChange={e=>setEstado(e.target.value)}>
        <option value="">Estado: todos</option>
        <option value="PAGADA">PAGADA</option>
        <option value="CANCELADA">CANCELADA</option>
        </select>

        <input type="date" className="form-control form-control-sm" value={desde} onChange={e=>setDesde(e.target.value)} style={{width:160}} />
        <input type="date" className="form-control form-control-sm" value={hasta} onChange={e=>setHasta(e.target.value)} style={{width:160}} />
        <span className="ms-auto text-muted">Total: {total}</span>
      </div>

      {loading && <div className="alert alert-secondary">Cargando…</div>}
      {err && <div className="alert alert-danger">{err}</div>}
      {!loading && !err && ventas.length === 0 && <div className="alert alert-info">No hay ventas.</div>}

      <div className="row g-3">
        {ventas.map(v => (
          <div className="col-md-6" key={v.id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <div>
                    <span className="badge text-bg-secondary me-2">{v.estado}</span>
                    <strong>#{v.id}</strong>
                  </div>
                  <small className="text-muted">{new Date(v.creado_en).toLocaleString()}</small>
                </div>

                <ul className="small mb-2">
                  {v.detalles?.map(d => (
                    <li key={d.id}>
                      {d.producto?.sku ? `${d.producto.sku} — ` : ""}{d.producto?.nombre || `#${d.producto_id}`} × {d.cantidad}
                    </li>
                  ))}
                </ul>

                <div className="d-flex justify-content-between align-items-center">
                  <strong>Total: Q {Number(v.total).toFixed(2)}</strong>
                  <button className="btn btn-sm btn-outline-primary" onClick={()=>setSel(v)}>
                    Ver ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sel && <TicketVenta venta={sel} onClose={()=>setSel(null)} />}
    </div>
  );
}
