import React, { useEffect, useState } from "react";
import api from "../api/client";

const init = {
  sku: "", nombre: "", descripcion: "",
  categoria_id: "", precio: "", costo: "",
  stock: "", stock_minimo: "", estado: "ACTIVO",
};

export default function AdminNuevoComponente() {
  const [cat, setCat] = useState([]);
  const [f, setF] = useState(init);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/admin/categorias");
        setCat(data?.categorias ?? []);
      } catch { /* ignore */ }
    })();
  }, []);

  const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg("");
    try {
      const payload = {
        ...f,
        precio: Number(f.precio || 0),
        costo: Number(f.costo || 0),
        stock: Number(f.stock || 0),
        stock_minimo: Number(f.stock_minimo || 0),
        categoria_id: Number(f.categoria_id),
      };
      await api.post("/admin/componentes", payload);
      setMsg("Componente creado correctamente");
      setF(init);
    } catch (err) {
      setMsg(err?.response?.data?.message || "❌ Error al crear componente");
    } finally { setLoading(false); }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Nuevo componente</h2>
      {msg && <div className="alert alert-info">{msg}</div>}

      <form onSubmit={submit} className="row g-3">
        <div className="col-md-6">
          <label className="form-label">SKU</label>
          <input className="form-control" name="sku" value={f.sku} onChange={onChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Nombre</label>
          <input className="form-control" name="nombre" value={f.nombre} onChange={onChange} required />
        </div>

        <div className="col-12">
          <label className="form-label">Descripción</label>
          <textarea className="form-control" rows="3" name="descripcion"
            value={f.descripcion} onChange={onChange} />
        </div>

        <div className="col-md-4">
          <label className="form-label">Categoría</label>
          <select className="form-select" name="categoria_id" value={f.categoria_id} onChange={onChange} required>
            <option value="">— Selecciona —</option>
            {cat.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Precio</label>
          <input type="number" step="0.01" className="form-control"
            name="precio" value={f.precio} onChange={onChange} required />
        </div>
        <div className="col-md-4">
          <label className="form-label">Costo</label>
          <input type="number" step="0.01" className="form-control"
            name="costo" value={f.costo} onChange={onChange} required />
        </div>

        <div className="col-md-4">
          <label className="form-label">Stock</label>
          <input type="number" className="form-control"
            name="stock" value={f.stock} onChange={onChange} required />
        </div>
        <div className="col-md-4">
          <label className="form-label">Stock mínimo</label>
          <input type="number" className="form-control"
            name="stock_minimo" value={f.stock_minimo} onChange={onChange} required />
        </div>
        <div className="col-md-4">
          <label className="form-label">Estado</label>
          <select className="form-select" name="estado" value={f.estado} onChange={onChange}>
            <option>ACTIVO</option>
            <option>INACTIVO</option>
          </select>
        </div>

        <div className="col-12">
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Guardando…" : "Crear componente"}
          </button>
        </div>
      </form>
    </div>
  );
}
