import React, { useEffect, useMemo, useState } from "react";
import api from "../api/client";

const TIPO = { TODOS: "", COMP: "COMPONENTE", PRE: "PREARMADA", PERSONALIZADA: "PERSONALIZADA" };

export default function EmpleadoVenta() {
  const [tipo, setTipo] = useState(TIPO.TODOS);
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // Venta pendiente y modal
  const [ventaPendiente, setVentaPendiente] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // carrito
  const [cart, setCart] = useState([]);
  const [cliente, setCliente] = useState({ nombre: "", correo: "" });
  const total = useMemo(
    () => cart.reduce((acc, it) => acc + Number(it.precio) * Number(it.cantidad || 1), 0),
    [cart]
  );

  const fetchCatalog = async () => {
    setErr(""); setLoading(true);
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
  useEffect(() => { fetchCatalog(); }, [tipo]);

  const addToCart = (p) => {
    if (cart.some(x => x.producto_id === p.id)) return;
    setCart([...cart, {
      producto_id: p.id,
      sku: p.sku,
      nombre: p.nombre,
      precio: Number(p.precio),
      stock: Number(p.stock),
      cantidad: 1,
    }]);
  };
  const rmFromCart = (id) => setCart(cart.filter(x => x.producto_id !== id));
  const updQty = (id, qty) => setCart(cart.map(x => x.producto_id === id ? { ...x, cantidad: qty } : x));

 
  const confirmar = async () => {
    if (cart.length === 0) { setErr("Agrega al menos 1 producto al carrito."); return; }
     if (!cliente.nombre.trim()) {
    setErr("Ingresa el nombre del cliente.");
    return;
     }
    for (const it of cart) {
      if (it.cantidad < 1) { setErr(`Cantidad inválida para ${it.sku}`); return; }
      if (it.cantidad > it.stock) { setErr(`Stock insuficiente para ${it.sku}`); return; }
    }

    try {
      setErr("");
      const payload = {
        cliente_nombre: cliente.nombre.trim(),  
        cliente_correo: cliente.correo?.trim() || null,
        items: cart.map(it => ({
          producto_id: it.producto_id,
          cantidad: Number(it.cantidad),     // 👈 usar "cantidad", no "qty"
          precio: Number(it.precio),
        })),
      };
      const { data } = await api.post("/ventas", payload, {
        headers: { "Content-Type": "application/json" },
      });
      setVentaPendiente(data?.venta); // { id, total, estado: PENDIENTE }
      setShowModal(true);
      setCliente({ nombre: "", correo: "" });
      fetchCatalog(); // refresca stock
    } catch (e) {
      setErr(e?.response?.data?.message || "No se pudo crear la venta.");
    }
  };

  // Acciones del modal
  const pagar = async () => {
    if (!ventaPendiente) return;
    try {
      await api.post(`/ventas/${ventaPendiente.id}/pagar`);
      setShowModal(false);
      setVentaPendiente(null);
      setCart([]);
      setCliente({ nombre: "", correo: "" });
      await fetchCatalog(); // refresca stock
      alert("Venta pagada");
    } catch (e) {
      alert(e?.response?.data?.message || "No se pudo pagar");
    }
  };
  const cancelar = async () => {
    if (!ventaPendiente) return;
    try {
      await api.post(`/ventas/${ventaPendiente.id}/cancelar`);
      setShowModal(false);
      setVentaPendiente(null);
      setCart([]);
      setCliente({ nombre: "", correo: "" });
      await fetchCatalog(); // repuso stock, refrescar
      alert("Venta cancelada");
    } catch (e) {
      alert(e?.response?.data?.message || "No se pudo cancelar");
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <h4 className="mb-0"><i className="bi bi-bag-check me-2" />Vender</h4>
        <select className="form-select form-select-sm" style={{width:180}}
                value={tipo} onChange={(e)=>setTipo(e.target.value)}>
          <option value={TIPO.TODOS}>Tipo: todos</option>
          <option value={TIPO.COMP}>Componentes</option>
          <option value={TIPO.PRE}>PC prearmadas</option>
          <option value={TIPO.PERSONALIZADA}>Pc Personalizada</option>
        </select>
        <div className="input-group" style={{maxWidth:360}}>
          <input className="form-control form-control-sm" placeholder="Buscar (sku, nombre, marca, modelo, desc.)"
                 value={q} onChange={(e)=>setQ(e.target.value)} />
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchCatalog}>
            <i className="bi bi-search" />
          </button>
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={fetchCatalog}>
          <i className="bi bi-arrow-clockwise" /> Actualizar
        </button>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}
      {loading && <div className="alert alert-secondary">Cargando catálogo…</div>}

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="row g-3">
            {items.map(p => (
              <div className="col-md-6 col-xl-4" key={p.id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="badge text-bg-secondary">{p.tipo}</span>
                      <small className="text-muted">{p.sku}</small>
                    </div>
                    <h6 className="card-title mb-1">{p.nombre}</h6>
                    {(p.marca || p.modelo) && (
                      <div className="text-muted small mb-1">
                        {[p.marca, p.modelo].filter(Boolean).join(" ")}
                      </div>
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
                    <button className="btn btn-primary btn-sm mt-2"
                            disabled={p.stock <= 0 || cart.some(x => x.producto_id === p.id)}
                            onClick={() => addToCart(p)}>
                      <i className="bi bi-cart-plus me-1" /> Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && items.length === 0 && <div className="alert alert-info ms-3">Sin resultados.</div>}
          </div>
        </div>

        {/* Carrito */}
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title"><i className="bi bi-cart me-2" />Carrito</h5>

              <div className="mb-2">
             <input className="form-control form-control-sm mb-1" placeholder="Cliente (obligatorio)"
                        required
                        value={cliente.nombre}
                        onChange={e=>setCliente({...cliente, nombre:e.target.value})}/>
                <input className="form-control form-control-sm" placeholder="Correo (opcional)"
                       value={cliente.correo} onChange={e=>setCliente({...cliente, correo:e.target.value})}/>
              </div>

              {cart.length === 0 && <div className="alert alert-info">Aún no has agregado productos.</div>}

              {cart.length > 0 && (
                <ul className="list-group mb-2">
                  {cart.map(it => (
                    <li className="list-group-item d-flex flex-column" key={it.producto_id}>
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong>{it.sku}</strong> — {it.nombre}
                          <div className="text-muted small">Q {it.precio.toFixed(2)} c/u · stock: {it.stock}</div>
                        </div>
                        <button className="btn btn-sm btn-outline-danger" onClick={()=>rmFromCart(it.producto_id)}>
                          Quitar
                        </button>
                      </div>
                      <div className="d-flex align-items-center mt-2">
                        <span className="me-2 small">Cant.</span>
                        <input type="number" min="1" max={it.stock} className="form-control form-control-sm"
                               style={{width:100}}
                               value={it.cantidad}
                               onChange={(e)=>updQty(it.producto_id, Number(e.target.value))}/>
                        <span className="ms-auto">
                          Q {(it.precio * it.cantidad).toFixed(2)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="d-flex justify-content-between">
                <strong>Total</strong>
                <strong>Q {total.toFixed(2)}</strong>
              </div>

              {/* 👇 usa el flujo NUEVO */}
              <button className="btn btn-success w-100 mt-2" disabled={cart.length===0} onClick={confirmar}>
                <i className="bi bi-check2-circle me-1" /> Confirmar venta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 👇 Modal dentro del return */}
      {showModal && ventaPendiente && (
        <div className="modal fade show d-block" tabIndex="-1" style={{background:'rgba(0,0,0,0.35)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-cash-coin me-2" />Venta #{ventaPendiente.id}</h5>
                <button className="btn-close" onClick={()=>setShowModal(false)} />
              </div>
              <div className="modal-body">
                <p>¿Qué deseas hacer con esta venta?</p>
                <ul className="mb-0">
                  <li><b>Total:</b> Q {Number(ventaPendiente.total).toFixed(2)}</li>
                  <li><b>Estado:</b> {ventaPendiente.estado}</li>
                </ul>
                <small className="text-muted">Si cancelas, se repondrá el stock automáticamente.</small>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-danger" onClick={cancelar}>
                  <i className="bi bi-x-circle me-1" /> Cancelar venta
                </button>
                <button className="btn btn-success" onClick={pagar}>
                  <i className="bi bi-check2-circle me-1" /> Ir a pagar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
