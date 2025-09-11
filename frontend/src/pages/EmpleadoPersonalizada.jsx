import React, { useEffect, useMemo, useState } from "react";
import api from "../api/client";


const OBLIGATORIAS = ["CPU", "RAM", "ALMACENAMIENTO", "PSU", "GABINETE"];
const SINGLE = new Set(["CPU", "PSU", "GABINETE", "MOTHERBOARD"]); 

const CAT_KEY = (title = "") => {
  const t = title.trim().toUpperCase();
  if (t.startsWith("ALMACEN")) return "ALMACENAMIENTO";
  if (t.startsWith("FUENTE") || t === "PSU") return "PSU";
  if (t.startsWith("MEMORIA") || t === "RAM") return "RAM";
  if (t.startsWith("MOTHER")) return "MOTHERBOARD";
  if (t.startsWith("GABIN")) return "GABINETE";
  if (t.startsWith("CPU")) return "CPU";
  if (t.startsWith("GPU")) return "GPU";
  if (t.includes("SISTEMA") || t === "COOLER") return "SISTEMA_DE_ENFRIAMIENTO";
  if (t.includes("ACCESORIOS")) return "OTROS";
  return t; 
};

export default function EmpleadoPersonalizada() {
  const [cats, setCats] = useState({});    
  const [sel, setSel] = useState({});      
  const [nombre, setNombre] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteCorreo, setClienteCorreo] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Carga: productos agrupados por categoría 
  const fetch = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/componentes/por-categoria");
      setCats(data?.categorias ?? {});
    } catch (e) {
      setErr(e?.response?.data?.message || "No se pudo cargar el catálogo.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetch(); }, []);

  //  carrito/selección
  const add = (catTitle, item) => {
    const key = CAT_KEY(catTitle);
    setSel(prev => {
      const arr = prev[key] ?? [];
      if (SINGLE.has(key)) return { ...prev, [key]: [{ ...item, cantidad: 1 }] };
      if (arr.some(x => x.id === item.id)) return prev; // evita duplicado
      return { ...prev, [key]: [...arr, { ...item, cantidad: 1 }] };
    });
  };
  const rm = (catTitle, id) => {
    const key = CAT_KEY(catTitle);
    setSel(prev => ({ ...prev, [key]: (prev[key] || []).filter(x => x.id !== id) }));
  };
  const updCant = (catTitle, id, cant) => {
    const key = CAT_KEY(catTitle);
    setSel(prev => ({
      ...prev,
      [key]: (prev[key] || []).map(x => x.id === id ? { ...x, cantidad: Number(cant) } : x)
    }));
  };

  
  const precioFinal = useMemo(() => {
    let t = 0;
    for (const k in sel) for (const it of sel[k]) t += Number(it.precio) * Number(it.cantidad || 1);
    return t;
  }, [sel]);

  // Falta algo? -> se calcula en vivo (no queda "pegado")
  const falta = useMemo(() => {
    // faltantes obligatorias
    for (const c of OBLIGATORIAS) {
      if (!sel[c] || sel[c].length === 0) return `Falta ${c}`;
    }
    // mínimos
    const sum = k => (sel[k] || []).reduce((a, b) => a + Number(b.cantidad || 1), 0);
    if (sum("RAM") < 1) return "Debe llevar al menos 1 módulo de RAM";
    if (sum("ALMACENAMIENTO") < 1) return "Debe llevar al menos 1 unidad de almacenamiento";
    // cantidades y stock
    for (const k in sel) {
      for (const it of sel[k] || []) {
        if (Number(it.cantidad) < 1) return `Cantidad inválida en ${k}`;
        if (Number(it.cantidad) > Number(it.stock)) return `Stock insuficiente: ${it.sku}`;
      }
    }
    if (!nombre.trim()) return "Asigna un nombre a la PC";
    if (!clienteNombre.trim()) return "El nombre del cliente es obligatorio";
    return "";
  }, [sel, nombre, clienteNombre]);

// estados nuevos
const [ventaPendiente, setVentaPendiente] = useState(null);
const [showModal, setShowModal] = useState(false);
const [canceling, setCanceling] = useState(false);
const [busyPay, setBusyPay] = useState(false);
const [busyCancel, setBusyCancel] = useState(false);


const [preview, setPreview] = useState(null);
const [payloadVenta, setPayloadVenta] = useState(null);


const submit = async () => {
  if (falta) return;
  try {
    const componentes = [];
    for (const key in sel)
      for (const it of sel[key])
        componentes.push({ id: it.id, cantidad: Number(it.cantidad) });

    const payload = {
      nombre: nombre.trim(),
      cliente_nombre: clienteNombre.trim(),
      cliente_correo: clienteCorreo.trim() || null,
      componentes
    };

    // PREVISUALIZAR (no crea venta)
    const { data } = await api.post("/personalizadas/previsualizar", payload, {
      headers: { "Content-Type": "application/json" },
    });

    setPreview(data);
    setPayloadVenta(payload);
    setShowModal(true);        
  } catch (e) {
    setErr(e?.response?.data?.message || "No se pudo previsualizar la PC.");
  }
};


const onPagar = async () => {
  if (!payloadVenta) return;
  setBusyPay(true);
  try {
    // 1) crear venta PENDIENTE (usa tu endpoint actual)
    const { data: ventaData } = await api.post("/personalizadas/vender", payloadVenta, {
      headers: { "Content-Type": "application/json" },
    });

    // 2) marcar como PAGADA
    await api.post(`/ventas/${ventaData.venta.id}/pagar`);

    // limpiar estados y refrescar catálogo
    setShowModal(false);
    setPreview(null);
    setPayloadVenta(null);
    setVentaPendiente(null);

    setSel({}); setNombre(""); setClienteNombre(""); setClienteCorreo("");
    await fetch();

    alert(`Venta #${ventaData?.venta?.id} pagada. Total Q ${Number(ventaData?.venta?.total || 0).toFixed(2)}`);
  } catch (e) {
    setErr(e?.response?.data?.message || "No se pudo completar el pago.");
  } finally {
    setBusyPay(false);
  }
};

// CANCELAR del primer modal ahora solo cierra (no crea nada)
const onCancelar = () => {
  setShowModal(false);
  setPreview(null);
  setPayloadVenta(null);
};

const confirmarCancelacion = async (modo) => {
  if (!ventaPendiente) return;
  setBusyCancel(true);
  try {
    await api.post(
      `/ventas/${ventaPendiente.id}/cancelar`,
      { modo },
      { headers: { "Content-Type": "application/json" } }
    );
    setCanceling(false);
    setVentaPendiente(null);
    setSel({}); setNombre(""); setClienteNombre(""); setClienteCorreo("");
    await fetch();
  } catch (e) {
    setErr(e?.response?.data?.message || "No se pudo cancelar la venta.");
  } finally {
    setBusyCancel(false);
  }
};

const onPreviewCancelar = async () => {
  if (!payloadVenta) return;
  setBusyCancel(true);
  try {
    // crea la venta en estado PENDIENTE
    const { data } = await api.post("/personalizadas/vender", payloadVenta, {
      headers: { "Content-Type": "application/json" },
    });

    // guarda la venta y abre el sub-modal
    setVentaPendiente(data.venta);
    setShowModal(false);   // cierra preview
    setPreview(null);
    setCanceling(true);    // abre sub-modal "reponer / catálogo"
  } catch (e) {
    setErr(e?.response?.data?.message || "No se pudo preparar la cancelación.");
  } finally {
    setBusyCancel(false);
  }
};


  // ¿esta categoría (header sin normalizar) es obligatoria?
  const isHeaderObligatoria = (header) => OBLIGATORIAS.includes(CAT_KEY(header));

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <h4 className="mb-0"><i className="bi bi-pc-display me-2" />PC personalizada</h4>
      </div>

      {falta && <div className="alert alert-danger">{falta}</div>}
      {err && <div className="alert alert-danger">{err}</div>}
      {loading && <div className="alert alert-secondary">Cargando…</div>}

      {/* Datos generales */}
      <div className="row g-2 mb-3">
        <div className="col-md-4">
          <input className="form-control" placeholder="Nombre de la PC"
                 value={nombre} onChange={e=>setNombre(e.target.value)} />
        </div>
        <div className="col-md-3">
          <input className="form-control" placeholder="Cliente (requerido)"
                 value={clienteNombre} onChange={e=>setClienteNombre(e.target.value)} />
        </div>
        <div className="col-md-3">
          <input className="form-control" placeholder="Correo (opcional)"
                 value={clienteCorreo} onChange={e=>setClienteCorreo(e.target.value)} />
        </div>
        <div className="col-md-2 text-end">
          <div className="fs-6 mt-1">Precio estimado: <b>Q {precioFinal.toFixed(2)}</b></div>
        </div>
      </div>

      {/* Listas por categoría */}
      <div className="row g-3">
        {Object.keys(cats).map(catTitle => (
          <div className="col-lg-6" key={catTitle}>
            <div className="card h-100 shadow-sm">
              <div className="card-header d-flex justify-content-between align-items-center">
                <strong>{catTitle}</strong>
                {isHeaderObligatoria(catTitle) && <span className="badge text-bg-primary">Obligatorio</span>}
              </div>
              <div className="card-body">
                {(cats[catTitle] || []).map(p => {
                  const key = CAT_KEY(catTitle);
                  const ya = (sel[key] || []).some(x => x.id === p.id);
                  return (
                    <div key={p.id} className="d-flex align-items-center justify-content-between border-bottom py-2">
                      <div>
                        <div><b>{p.sku}</b> — {p.nombre}</div>
                        <small className="text-muted">Q {Number(p.precio).toFixed(2)} · stock:{p.stock}</small>
                      </div>
                      <button className="btn btn-sm btn-outline-primary" disabled={ya}
                              onClick={()=>add(catTitle, p)}>
                        Agregar
                      </button>
                    </div>
                  );
                })}

                {(sel[CAT_KEY(catTitle)] || []).length > 0 && (
                  <ul className="list-group mt-3">
                    {sel[CAT_KEY(catTitle)].map(it => (
                      <li key={it.id} className="list-group-item d-flex align-items-center">
                        <div className="me-2"><b>{it.sku}</b></div>
                        <div className="me-2">{it.nombre}</div>
                        <div className="ms-auto d-flex align-items-center">
                          <input type="number" min="1" max={it.stock}
                                 value={it.cantidad}
                                 onChange={(e)=>updCant(catTitle, it.id, Number(e.target.value))}
                                 className="form-control form-control-sm" style={{width:100}}/>
                          <button className="btn btn-sm btn-outline-danger ms-2"
                                  onClick={()=>rm(catTitle, it.id)}>
                            Quitar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

            {/* Modal principal */}
{showModal && ventaPendiente && (
  <div className="modal fade show d-block" tabIndex="-1" role="dialog"
       style={{ background:'rgba(0,0,0,.4)', zIndex:1055 }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Venta #{ventaPendiente.id}</h5>
          <button type="button" className="btn-close" onClick={()=>setShowModal(false)} />
        </div>
        <div className="modal-body">
          <p>Total: <b>Q {Number(ventaPendiente.total).toFixed(2)}</b></p>
          <p>¿Deseas marcar la venta como pagada o cancelarla?</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-success" onClick={onPagar} disabled={busyPay}>
            {busyPay ? "Pagando…" : (<><i className="bi bi-cash-coin me-1" /> Pagar</>)}
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={onCancelar} disabled={busyPay}>
            <i className="bi bi-x-circle me-1" /> Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Sub-modal cancelación */}
{canceling && (
  <div className="modal fade show d-block" tabIndex="-1" role="dialog"
       style={{ background:'rgba(0,0,0,.45)', zIndex:1060 }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Cancelar venta #{ventaPendiente?.id}</h5>
          <button type="button" className="btn-close" onClick={()=>setCanceling(false)} />
        </div>
        <div className="modal-body">
          <p>¿Cómo quieres proceder?</p>
          <ul className="mb-0">
            <li><b>Reponer componentes</b>: se desarma la PC y los componentes vuelven a stock.</li>
            <li><b>Enviar PC al catálogo</b>: se mantiene la PC personalizada con stock 1 para venderla después.</li>
          </ul>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-danger"
                  onClick={()=>confirmarCancelacion('reponer')} disabled={busyCancel}>
            {busyCancel ? "Procesando…" : "Reponer componentes"}
          </button>
          <button type="button" className="btn btn-primary"
                  onClick={()=>confirmarCancelacion('catalogo')} disabled={busyCancel}>
            {busyCancel ? "Procesando…" : "Enviar al catálogo"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
{showModal && preview && (
  <div className="modal fade show d-block" tabIndex="-1" role="dialog"
       style={{ background:'rgba(0,0,0,.4)', zIndex:1055 }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Confirmar venta</h5>
          <button type="button" className="btn-close" onClick={()=>setShowModal(false)} />
        </div>
        <div className="modal-body">
          <p className="mb-2">
            Cliente: <b>{clienteNombre}</b> — PC: <b>{nombre}</b>
          </p>
          <p>Total estimado: <b>Q {Number(preview.total).toFixed(2)}</b></p>

          <ul className="small">
            {preview.componentes.map(x => (
              <li key={x.id}>
                {x.sku} — {x.nombre} × {x.cantidad} = Q {Number(x.subtotal).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
        <div className="modal-footer">
          {/* Volver: solo cierra el preview */}
          <button type="button" className="btn btn-outline-secondary" onClick={()=>setShowModal(false)}>
            Volver
          </button>

          {/* Cancelar: abre el sub-modal de “Reponer / Enviar al catálogo” */}
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={onPreviewCancelar}
            disabled={busyCancel}
          >
            {busyCancel ? "Procesando…" : "Cancelar"}
          </button>


          {/* Pagar */}
          <button type="button" className="btn btn-success" onClick={onPagar} disabled={busyPay}>
            {busyPay ? "Procesando…" : (<><i className="bi bi-cash-coin me-1" /> Pagar</>)}
          </button>
        </div>
      </div>
    </div>
  </div>
)}


      <div className="d-flex justify-content-end mt-3">
        <button className="btn btn-success" onClick={submit} disabled={!!falta || loading}>
          <i className="bi bi-cash-coin me-1" /> Crear y vender
        </button>
      </div>
    </div>
      
  );
}
