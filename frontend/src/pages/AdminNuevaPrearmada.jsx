import React, { useEffect, useState } from "react";
import api from "../api/client";

const init = {
  sku: "",
  nombre: "",
  descripcion: "",
  marca: "",
  modelo: "",
  pc_categoria_id: "",
  precio: "",
  stock: "",
};

export default function AdminNuevaPrearmada() {
  const [f, setF] = useState(init);
  const [cats, setCats] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/admin/pc-categorias");
        setCats(data?.categorias ?? []);
      } catch (e) {
        setMsg("No se pudieron cargar las categorías de PC.");
      }
    })();
  }, []);

  const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const payload = {
        sku: f.sku.trim(),
        nombre: f.nombre.trim(),
        marca: f.marca?.trim() || null,
        modelo: f.modelo?.trim() || null,
        descripcion: f.descripcion?.trim() || null,
        especificaciones: null, // si luego agregas un campo aparte
        pc_categoria_id: Number(f.pc_categoria_id),
        precio: Number(f.precio || 0),
        stock: Number(f.stock || 0),
      };
      await api.post("/admin/prearmadas", payload);
      setMsg("Prearmada creada");
      setF(init);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Error al crear prearmada");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h4 className="mb-3"><i className="bi bi-pc me-2" />Nueva PC prearmada <span className="badge text-bg-secondary">v2</span></h4>
      {msg && <div className="alert alert-info">{msg}</div>}

      <form className="row g-3" onSubmit={submit}>
        <div className="col-md-6">
          <label className="form-label">SKU</label>
          <input className="form-control" name="sku" value={f.sku} onChange={onChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Nombre</label>
          <input className="form-control" name="nombre" value={f.nombre} onChange={onChange} required />
        </div>

        <div className="col-md-6">
          <label className="form-label">Marca (opcional)</label>
          <input className="form-control" name="marca" value={f.marca} onChange={onChange} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Modelo (opcional)</label>
          <input className="form-control" name="modelo" value={f.modelo} onChange={onChange} />
        </div>

        <div className="col-12">
          <label className="form-label">Descripción (Especificaciones)</label>
          <textarea className="form-control" rows="4" name="descripcion" value={f.descripcion} onChange={onChange}
            placeholder="Ej: Intel i5, 16GB RAM, 512GB SSD, RTX 3060..." />
        </div>

        <div className="col-md-6">
          <label className="form-label">Categoría de PC</label>
          <select className="form-select" name="pc_categoria_id" value={f.pc_categoria_id} onChange={onChange} required>
            <option value="">— Selecciona —</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label">Precio</label>
          <input type="number" step="0.01" className="form-control" name="precio" value={f.precio} onChange={onChange} required />
        </div>
        <div className="col-md-3">
          <label className="form-label">Stock</label>
          <input type="number" className="form-control" name="stock" value={f.stock} onChange={onChange} required />
        </div>

        <div className="col-12">
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Guardando…" : "Crear prearmada"}
          </button>
        </div>
      </form>
    </div>
  );
}
