import React, { useEffect, useState } from "react";
import api from "../api/client";

const init = {
  tipo: "VENTA",
  asignado_a: "",
  vence_en: "",
  datos_raw: "",   
};

export default function AdminNuevaTarea() {
  const [empleados, setEmpleados] = useState([]);
  const [f, setF] = useState(init);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

useEffect(() => {
  (async () => {
    try {
      const { data } = await api.get("/empleados", { params: { per_page: 1000 } });
      const list = Array.isArray(data?.data) ? data.data
                 : Array.isArray(data?.empleados) ? data.empleados
                 : [];
      const activos = list.filter(e => e.estado === "ACTIVO");
      setEmpleados(activos);
      if (activos.length === 0) setMsg("No hay empleados activos para asignar.");
    } catch (e) {
      console.error("GET /empleados", e);
      setMsg(e?.response?.data?.message || "No se pudo cargar la lista de empleados.");
    }
  })();
}, []);




  const onChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

const submit = async (e) => {
  e.preventDefault();
  setMsg(""); 
  setLoading(true);
  try {
    await api.post("/tareas", {
      tipo: f.tipo,
      asignado_a: Number(f.asignado_a),
      vence_en: f.vence_en || null,
      datos: f.datos_raw.trim() || null,  
    });
    setMsg("Tarea creada");
    setF(init);
  } catch (err) {
    setMsg(err?.response?.data?.message || "Error al crear tarea");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="container mt-4">
      <h2 className="mb-4">Nueva tarea</h2>
      {msg && <div className="alert alert-info">{msg}</div>}

      <form onSubmit={submit} className="row g-3">
        <div className="col-md-4">
          <label className="form-label">Tipo</label>
          <select className="form-select" name="tipo" value={f.tipo} onChange={onChange}>
            <option value="VENTA">VENTA</option>
            <option value="ENSAMBLAJE">ENSAMBLAJE</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Empleado</label>        
            <select
                className="form-select"
                name="asignado_a"
                value={f.asignado_a}
                onChange={onChange}
                required
                disabled={empleados.length === 0}
                >
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
          <input type="datetime-local" className="form-control"
            name="vence_en" value={f.vence_en} onChange={onChange}/>
        </div>

        <div className="col-12">
          <label className="form-label">Datos</label>
          <textarea className="form-control" rows="6" name="datos_raw"
            value={f.datos_raw} onChange={onChange} spellCheck={false}/>
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
