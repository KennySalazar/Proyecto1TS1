import React, { useEffect, useState } from "react";
import api from "../api/client"; // 
const init = {
  sku: "", nombre: "", descripcion: "",
  precio: "", costo: "", stock: "", stock_minimo: "",
  estado: "ACTIVO",
};

export default function AdminNuevaPrearmada() {
  const [f, setF] = useState(init);
  const [componentes, setComponentes] = useState([]);
  const [bom, setBom] = useState([]);
  const [sel, setSel] = useState({ componente_id: "", cantidad: 1 });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/admin/componentes");
        setComponentes(data?.componentes ?? []);
      } catch { }
    })();
  }, []);

  const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const addBom = () => {
    if (!sel.componente_id) return;
    if (bom.find(b => b.componente_id === Number(sel.componente_id))) return;
    setBom([...bom, { componente_id: Number(sel.componente_id), cantidad: Number(sel.cantidad) }]);
    setSel({ componente_id: "", cantidad: 1 });
  };

  const rmBom = (id) => setBom(bom.filter(x => x.componente_id !== id));

  const compName = (id) => componentes.find(c => c.id === id)?.nombre || `#${id}`;

  const submit = async (e) => {
    e.preventDefault();
    if (bom.length === 0) { setMsg("❌ Agrega al menos un componente"); return; }
    setLoading(true); setMsg("");
    try {
      const payload = {
        ...f,
        precio: Number(f.precio || 0), costo: Number(f.costo || 0),
        stock: Number(f.stock || 0), stock_minimo: Number(f.stock_minimo || 0),
        bom
      };
      await api.post("/admin/prearmadas", payload);
      setMsg("✅ Prearmada creada");
      setF(init); setBom([]);
    } catch (err) {
      setMsg(err?.response?.data?.message || "❌ Error al crear prearmada");
    } finally { setLoading(false); }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Nueva PC prearmada</h2>
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
          <textarea className="form-control" rows="3"
            name="descripcion" value={f.descripcion} onChange={onChange} />
        </div>

        <div className="col-md-3">
          <label className="form-label">Precio</label>
          <input type="number" step="0.01" className="form-control"
            name="precio" value={f.precio} onChange={onChange} required />
        </div>
        <div className="col-md-3">
          <label className="form-label">Costo</label>
          <input type="number" step="0.01" className="form-control"
            name="costo" value={f.costo} onChange={onChange} required />
        </div>
        <div className="col-md-3">
          <label className="form-label">Stock</label>
          <input type="number" className="form-control"
            name="stock" value={f.stock} onChange={onChange} required />
        </div>
        <div className="col-md-3">
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
          <label className="form-label">Receta (BOM)</label>
          <div className="input-group mb-3">
            <select className="form-select" value={sel.componente_id}
              onChange={e => setSel({ ...sel, componente_id: e.target.value })}>
              <option value="">— Selecciona componente —</option>
              {componentes.map(c => (
                <option key={c.id} value={c.id}>{c.sku} — {c.nombre}</option>
              ))}
            </select>
            <input type="number" className="form-control" min="1"
              value={sel.cantidad} onChange={e => setSel({ ...sel, cantidad: e.target.value })}/>
            <button type="button" className="btn btn-outline-primary" onClick={addBom}>Agregar</button>
          </div>

          {bom.length > 0 &&
            <ul className="list-group">
              {bom.map(b => (
                <li key={b.componente_id} className="list-group-item d-flex justify-content-between">
                  {compName(b.componente_id)} x {b.cantidad}
                  <button type="button" className="btn btn-sm btn-danger"
                          onClick={() => rmBom(b.componente_id)}>Quitar</button>
                </li>
              ))}
            </ul>}
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
