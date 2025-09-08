// src/pages/EmpleadoTareas.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api/client";

const human = (s) => (s ?? "").replaceAll("_", " ").toLowerCase();
const fmt   = (d) => (d ? new Date(d).toLocaleString() : "—");

export default function EmpleadoTareas() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qEstado, setQEstado] = useState("");
  const [qTipo, setQTipo] = useState("");
  const [err, setErr] = useState("");

  const fetchAll = async () => {
    setLoading(true); setErr("");
    try {
      const params = {};
      if (qEstado) params.estado = qEstado;
      if (qTipo)   params.tipo   = qTipo;
      const { data } = await api.get("/tareas", { params });
      setRows(Array.isArray(data?.tareas) ? data.tareas : []);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Error al cargar tareas");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [qEstado, qTipo]);

  const avanzar = async (id, estado) => {
    try {
      await api.patch(`/tareas/${id}/estado`, { estado });
      await fetchAll();
    } catch (e) {
      alert(e?.response?.data?.message || "No se pudo actualizar el estado");
    }
  };

  const acciones = (t) => {
    const s = String(t.estado || "");
    if (s === "ABIERTA") {
      return (
        <div className="btn-group">
          <button className="btn btn-sm btn-outline-primary" onClick={() => avanzar(t.id, "EN_PROCESO")}>Iniciar</button>
          <button className="btn btn-sm btn-outline-danger"  onClick={() => avanzar(t.id, "CANCELADA")}>Cancelar</button>
        </div>
      );
    }
    if (s === "EN_PROCESO") {
      return (
        <div className="btn-group">
          <button className="btn btn-sm btn-success"        onClick={() => avanzar(t.id, "TERMINADA")}>Terminar</button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => avanzar(t.id, "CANCELADA")}>Cancelar</button>
        </div>
      );
    }
    return <span className="text-muted">—</span>;
  };

  const total = useMemo(() => rows.length, [rows]);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-3 mb-3">
        <h4 className="mb-0"><i className="bi bi-clipboard-check me-2" />Mis tareas</h4>

        <select className="form-select form-select-sm" style={{width:200}}
                value={qTipo} onChange={(e) => setQTipo(e.target.value)}>
          <option value="">Tipo: todas</option>
          <option value="ENSAMBLAJE">ENSAMBLAJE</option>
        </select>

        <select className="form-select form-select-sm" style={{width:220}}
                value={qEstado} onChange={(e) => setQEstado(e.target.value)}>
          <option value="">Estado: todos</option>
          <option value="ABIERTA">ABIERTA</option>
          <option value="EN_PROCESO">EN PROCESO</option>
          <option value="TERMINADA">TERMINADA</option>
          <option value="CANCELADA">CANCELADA</option>
        </select>

        <span className="text-muted ms-auto">Total: {total}</span>
      </div>

      {loading && <div className="alert alert-secondary">Cargando…</div>}
      {err && <div className="alert alert-danger">{err}</div>}
      {!loading && rows.length === 0 && !err && <div className="alert alert-info">No hay tareas.</div>}

      <div className="row g-3">
        {rows.map(t => (
          <div className="col-md-6" key={t.id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div>
                    <span className="badge text-bg-secondary text-uppercase me-2">{human(t.estado)}</span>
                    <strong>#{t.id}</strong> · <span className="text-uppercase">{t.tipo}</span>
                  </div>
                  <small className="text-muted">vence: {fmt(t.vence_en)}</small>
                </div>

{/* DESCRIPCIÓN (si existe) */}
{((t.descripcion ?? t.datos ?? "") + "").trim() !== "" && (
  <div
    className="bg-light p-2 rounded small mb-2"
    style={{ whiteSpace: "pre-wrap" }}
  >
    {t.descripcion ?? t.datos}
  </div>
)}


{/* ITEMS / BOM (si existen) */}
{Array.isArray(t.items) && t.items.length > 0 && (
  <ul className="small mb-2">
    {t.items.map((it) => (
      <li key={it.id || `${it.componente_id}`}>
        {it.producto?.sku ? `${it.producto.sku} — ` : ""}
        {it.producto?.nombre || `#${it.componente_id}`} × {it.cantidad}
      </li>
    ))}
  </ul>
)}

               
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    creado: {fmt(t.creado_en)} · actualizado: {fmt(t.actualizado_en)}
                  </small>
                  {acciones(t)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
