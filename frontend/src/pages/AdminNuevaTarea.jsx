import React, { useEffect, useState } from "react";
import api from "../api/client";

const init = {
  asignado_a: "",
  vence_en: "",
  descripcion: "",
};

export default function AdminNuevaTarea() {
  const [empleados, setEmpleados] = useState([]);
  const [componentes, setComponentes] = useState([]);
  const [f, setF] = useState(init);
  const [sel, setSel] = useState({ componente_id: "", cantidad: 1 });
  const [bom, setBom] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  
    const loadComponentes = async () => {
    const { data } = await api.get("/admin/componentes/lista");
    setComponentes(data?.componentes ?? []);
    };

  // Empleados
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/empleados", { params: { per_page: 1000 } });
        const list = Array.isArray(data?.data) ? data.data : (data?.empleados ?? []);
        setEmpleados(list.filter(e => e.estado === "ACTIVO"));
      } catch (e) {
        setMsg(e?.response?.data?.message || "No se pudo cargar empleados.");
      }
    })();
  }, []);

  // Componentes con stock para BOM
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/admin/componentes/lista");
        setComponentes(data?.componentes ?? []);
        await loadComponentes();
      } catch (e) {
        setMsg("No se pudo cargar la lista de componentes.");
      }
    })();
  }, []);

  const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const addBom = () => {
    if (!sel.componente_id) return;
    const id = Number(sel.componente_id);
    if (bom.find(x => x.componente_id === id)) return;
    setBom([...bom, { componente_id: id, cantidad: Number(sel.cantidad || 1) }]);
    setSel({ componente_id: "", cantidad: 1 });
  };

  const rmBom = (id) => setBom(bom.filter(x => x.componente_id !== id));

  const compLabel = (id) => {
    const c = componentes.find(x => x.id === id);
    if (!c) return `#${id}`;
    const extra = [c.marca, c.modelo].filter(Boolean).join(" ");
    return `${c.sku} — ${c.nombre}${extra ? ` (${extra})` : ""} · stock:${c.stock}`;
    };

const submit = async (e) => {
  e.preventDefault();
  setMsg("");
  setLoading(true);

  try {
    const payload = {
      tipo: "ENSAMBLAJE",
      asignado_a: Number(f.asignado_a),
      vence_en: f.vence_en || null,
      descripcion: (f.descripcion || "").trim(),         
      componentes: bom.map(x => ({
        id: Number(x.componente_id),               
        cantidad: Number(x.cantidad ?? 1),
      })),
    };

    // Útil para verificar:
    // console.log(JSON.stringify(payload, null, 2));

    await api.post("/tareas", payload, {
      headers: { "Content-Type": "application/json" },
    });

    setMsg("Tarea creada");
    setBom([]);
    setF(init);
    await loadComponentes();
  } catch (err) {
    setMsg(err?.response?.data?.message || "Error al crear tarea");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="container py-4">
      <h4 className="mb-3"><i className="bi bi-clipboard-plus me-2" />Nueva tarea</h4>
      {msg && <div className="alert alert-info">{msg}</div>}

      <form className="row g-3" onSubmit={submit}>
        <div className="col-md-4">
          <label className="form-label">Empleado</label>
          <select className="form-select" name="asignado_a" value={f.asignado_a} onChange={onChange} required>
            <option value="">— Selecciona —</option>
            {empleados.map(e => (
              <option key={e.id} value={e.id}>
                {e.codigo_empleado ? `${e.codigo_empleado} — ` : ""}{e.nombre} ({e.correo})
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Vence en</label>
          <input type="datetime-local" className="form-control" name="vence_en" value={f.vence_en} onChange={onChange} />
        </div>

        <div className="col-12">
          <label className="form-label">Descripción</label>
          <input className="form-control" name="descripcion" value={f.descripcion} onChange={onChange}
                 placeholder="Notas para el ensamblaje (opcional)" />
        </div>

        <div className="col-12">
          <label className="form-label">Componentes (BOM)</label>
          <div className="input-group mb-2">
            <select className="form-select" value={sel.componente_id}
                    onChange={(e) => setSel({ ...sel, componente_id: e.target.value })}>
              <option value="">— Selecciona componente —</option>
              {componentes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.sku} — {c.nombre}{c.marca ? ` (${c.marca}${c.modelo ? " " + c.modelo : ""})` : ""} · stock:{c.stock}
                </option>
              ))}
            </select>
            <input type="number" min="1" className="form-control" style={{maxWidth:120}}
                   value={sel.cantidad} onChange={(e)=>setSel({ ...sel, cantidad: e.target.value })} />
            <button type="button" className="btn btn-outline-primary" onClick={addBom}>Agregar</button>
          </div>

          {bom.length > 0 && (
            <ul className="list-group">
              {bom.map(b => (
                <li key={b.componente_id} className="list-group-item d-flex justify-content-between">
                  <span>{compLabel(b.componente_id)} × {b.cantidad}</span>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => rmBom(b.componente_id)}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="col-12">
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Guardando…" : "Crear tarea"}
          </button>
        </div>
      </form>
    </div>
  );
}
