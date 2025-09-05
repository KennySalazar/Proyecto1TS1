// src/pages/AdminNuevoComponente.jsx
import { useEffect, useState } from "react";
import api from "../api/client";

const init = {
  sku:"", nombre:"", descripcion:"",
  categoria_id:"", marca:"", modelo:"",
  precio:"", stock:""
};

export default function AdminNuevoComponente() {
  const [cats, setCats] = useState([]);
  const [f, setF] = useState(init);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/admin/categorias");
        setCats(data?.categorias ?? []);
      } catch {/* ignore */}
    })();
  }, []);

  const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg("");
    try {
      const payload = {
        sku: f.sku.trim(),
        nombre: f.nombre.trim(),
        descripcion: f.descripcion,
        tipo: "COMPONENTE",
        categoria_id: Number(f.categoria_id),
        marca: f.marca.trim() || null,
        modelo: f.modelo.trim() || null,
        precio: Number(f.precio || 0),
        stock: Number(f.stock || 0),
      };
      await api.post("/admin/componentes", payload);
      setMsg("✅ Componente creado correctamente");
      setF(init);
    } catch (err) {
      setMsg(err?.response?.data?.message || "❌ Error al crear componente");
    } finally { setLoading(false); }
  };

  return (
    <div className="container mt-4">
      <h4 className="mb-3">Nuevo componente</h4>
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
          <label className="form-label">Descripción (especificaciones)</label>
          <textarea className="form-control" rows="3" name="descripcion"
            value={f.descripcion} onChange={onChange} />
        </div>

        <div className="col-md-4">
          <label className="form-label">Categoría</label>
          <select className="form-select" name="categoria_id" value={f.categoria_id} onChange={onChange} required>
            <option value="">— Selecciona —</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Marca</label>
          <input className="form-control" name="marca" value={f.marca} onChange={onChange} />
        </div>
        <div className="col-md-4">
          <label className="form-label">Modelo / Serie</label>
          <input className="form-control" name="modelo" value={f.modelo} onChange={onChange} />
        </div>

        <div className="col-md-4">
          <label className="form-label">Precio</label>
          <input type="number" step="0.01" className="form-control"
            name="precio" value={f.precio} onChange={onChange} required />
        </div>
        <div className="col-md-4">
          <label className="form-label">Stock</label>
          <input type="number" className="form-control"
            name="stock" value={f.stock} onChange={onChange} required />
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
