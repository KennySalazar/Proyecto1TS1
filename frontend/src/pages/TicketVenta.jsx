export default function TicketVenta({ venta, onClose }) {
  if (!venta) return null;

  const printNow = () => window.print();

  return (
    <div className="modal d-block" tabIndex="-1" style={{background:'rgba(0,0,0,.4)'}}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-receipt me-2" /> Ticket #{venta.id}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}/>
          </div>
          <div className="modal-body">
            <div className="mb-2">
              <div><b>Fecha:</b> {new Date(venta.creado_en).toLocaleString()}</div>
              <div><b>Vendedor:</b> {venta.vendedor?.nombre || "-"}</div>
              {venta.cliente_nombre && <div><b>Cliente:</b> {venta.cliente_nombre}</div>}
              {venta.cliente_correo && <div><b>Correo:</b> {venta.cliente_correo}</div>}
              <div><b>Estado:</b> {venta.estado}</div>
            </div>

            <ul className="list-group mb-2">
              {venta.detalles?.map(d => (
                <li key={d.id} className="list-group-item d-flex justify-content-between">
                  <div>
                    {d.producto?.sku ? `${d.producto.sku} — ` : ""}{d.producto?.nombre || `#${d.producto_id}`}
                    <div className="small text-muted">x {d.cantidad} · Q {Number(d.precio).toFixed(2)}</div>
                  </div>
                  <div><b>Q {Number(d.subtotal).toFixed(2)}</b></div>
                </li>
              ))}
            </ul>

            <div className="d-flex justify-content-end">
              <h5>Total: Q {Number(venta.total).toFixed(2)}</h5>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
            <button className="btn btn-primary" onClick={printNow}>
              <i className="bi bi-printer me-1" /> Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
