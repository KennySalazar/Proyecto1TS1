import React, { useEffect, useMemo, useState } from "react";
import api from "../api/client";

const Tipo = {
  TODOS: "",
  COMP: "COMPONENTE",
  PRE: "PREARMADA",
};

export default function EmpleadoCatalogo() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState(Tipo.TODOS);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchData = async () => {
    setLoading(true); setErr("");
    try {
      const params = {};
      if (tipo) params.tipo = tipo;
      if (q.trim()) params.search = q.trim();
      const { data } = await api.get("/catalogo/productos", { params });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "No se pudo cargar el catálogo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tipo]);

  const total = useMemo(() => items.length, [items]);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <h4 className="mb-0"><i className="bi bi-shop me-2" />Catálogo</h4>

        <select className="form-select form-select-sm" style={{width:160}} value={tipo}
                onChange={(e)=>setTipo(e.target.value)}>
          <option value={Tipo.TODOS}>Tipo: todos</option>
          <option value={Tipo.COMP}>Componentes</option>
          <option value={Tipo.PRE}>PC prearmadas</option>
          <option value="PERSONALIZADA">Personalizadas</option>
        </select>

        <div className="input-group" style={{maxWidth:360}}>
          <input className="form-control form-control-sm" placeholder="Buscar (sku, nombre, marca, modelo, desc.)"
                 value={q} onChange={(e)=>setQ(e.target.value)} />
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchData}>
            <i className="bi bi-search" />
          </button>
        </div>

        <span className="ms-auto text-muted">Total: {total}</span>
      </div>

      {loading && <div className="alert alert-secondary">Cargando…</div>}
      {err && <div className="alert alert-danger">{err}</div>}
      {!loading && !err && items.length === 0 && <div className="alert alert-info">Sin resultados.</div>}

      <div className="row g-3">
        {items.map(p => (
          <div className="col-md-4 col-lg-3" key={p.id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <span className="badge text-bg-secondary">{p.tipo}</span>
                  <small className="text-muted">{p.sku}</small>
                </div>
                <h6 className="card-title mb-1">{p.nombre}</h6>
                {(p.marca || p.modelo) && (
                  <div className="text-muted small mb-1">{[p.marca, p.modelo].filter(Boolean).join(" ")}</div>
                )}
                {p.pc_categoria?.nombre && (
                  <div className="small text-uppercase mb-1">
                    <i className="bi bi-grid" /> {p.pc_categoria.nombre}
                  </div>
                )}
                <div className="small text-muted mb-2" style={{whiteSpace:'pre-wrap'}}>
                  {p.descripcion || p.especificaciones || "-"}
                </div>
                <div className="mt-auto d-flex justify-content-between align-items-end">
                  <strong>Q {Number(p.precio).toFixed(2)}</strong>
                  <small className="text-muted">stock: {p.stock}</small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
