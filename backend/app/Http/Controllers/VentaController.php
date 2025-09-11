<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\Venta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;


class VentaController extends Controller
{
    // GET /ventas/mis
    public function misVentas(Request $r)
    {
        $user = Auth::user();

        $q = DB::table('ventas as v')
            ->select('v.id','v.cliente_nombre','v.cliente_correo','v.estado',
                     'v.total','v.creado_en','v.actualizado_en')
            ->where('v.vendedor_id', $user->id)
            ->orderByDesc('v.creado_en');

        return response()->json(['ventas' => $q->get()]);
    }

    // POST /ventas
    // payload:
    // {
    //   "cliente_nombre": "...", "cliente_correo": "...",
    //   "items": [{ "producto_id": 1, "cantidad": 2, "precio": 1200.00 }]
    // }
    public function store(Request $r)
    {
        $data = $r->validate([
            'cliente_nombre' => 'required|string|max:160',
            'cliente_correo' => 'nullable|email|max:160',
            'items'          => 'required|array|min:1',
            'items.*.producto_id' => 'required|integer|exists:productos,id',
            'items.*.cantidad'    => 'required|integer|min:1',
            'items.*.precio'      => 'required|numeric|min:0',
        ]);

        $userId = Auth::id();

        return DB::transaction(function () use ($data, $userId) {
            // 1) Crear cabecera
            $ventaId = DB::table('ventas')->insertGetId([
                'cliente_nombre' => $data['cliente_nombre'] ?? null,
                'cliente_correo' => $data['cliente_correo'] ?? null,
                'vendedor_id'    => $userId,
                'estado'         => 'PENDIENTE',
                'total'          => 0,
            ]);

            $total = 0;

            // 2) Validar stock y crear detalle
            foreach ($data['items'] as $row) {
                /** @var \App\Models\Producto $p */
                $p = Producto::lockForUpdate()->find($row['producto_id']); // lock
                if (!$p) abort(422, 'Producto no existe');

                if ($p->stock < $row['cantidad']) {
                    abort(422, "Stock insuficiente para {$p->sku} ({$p->nombre}). Disponible: {$p->stock}");
                }

                $subtotal = $row['precio'] * $row['cantidad'];
                $total += $subtotal;

                DB::table('venta_detalles')->insert([
                    'venta_id'    => $ventaId,
                    'producto_id' => $p->id,
                    'cantidad'    => $row['cantidad'],
                    'precio'      => $row['precio'],
                    'subtotal'    => $subtotal,
                ]);

                // 3) Descontar stock
                $p->decrement('stock', $row['cantidad']);

                // 4) Asentar movimiento de stock
                DB::table('movimientos_stock')->insert([
                    'producto_id'     => $p->id,
                    'cambio_cantidad' => -1 * $row['cantidad'],
                    'motivo'          => 'VENTA',
                    'referencia_tipo' => 'venta',
                    'referencia_id'   => $ventaId,
                ]);
            }

            // 5) Actualizar total
            DB::table('ventas')->where('id', $ventaId)->update(['total' => $total]);

            // Devuelve la venta creada
            $venta = DB::table('ventas')->where('id', $ventaId)->first();
            $det = DB::table('venta_detalles as d')
                ->join('productos as p','p.id','=','d.producto_id')
                ->select('d.id','d.producto_id','p.sku','p.nombre','d.cantidad','d.precio','d.subtotal')
                ->where('d.venta_id',$ventaId)->get();

            return response()->json(['message'=>'Venta creada','venta'=>$venta,'detalles'=>$det],201);
        });
    }

    // POST /ventas/{id}/pagar
        public function pagar(int $id)
    {
        $user = Auth::user();

        return DB::transaction(function () use ($id, $user) {
            $venta = DB::table('ventas')->where('id', $id)->lockForUpdate()->first();
            if (!$venta) {
                return response()->json(['message' => 'Venta no existe'], 404);
            }

            // Permisos: administrador o dueño de la venta
            $esAdmin = in_array(strtoupper(optional($user->rol)->nombre), ['ADMIN','ADMINISTRADOR'], true);
            if (!$esAdmin && $venta->vendedor_id !== $user->id) {
                return response()->json(['message' => 'No autorizado'], 403);
            }

            if ($venta->estado === 'CANCELADA') {
                return response()->json(['message' => 'No se puede pagar una venta cancelada'], 422);
            }

            if ($venta->estado === 'PAGADA') {
                // idempotente: no es error volver a pagar
                return response()->json(['message' => 'Venta ya estaba pagada'], 200);
            }

            if ($venta->estado !== 'PENDIENTE') {
                return response()->json(['message' => 'Estado inválido para pagar'], 422);
            }

            DB::table('ventas')->where('id', $id)->update(['estado' => 'PAGADA']);

            // (Opcional) registrar forma de pago, referencia, etc.
            // DB::table('pagos')->insert([...]);

            return response()->json(['message' => 'Venta pagada']);
        });
    }

        // EMPLEADO: Mis ventas (con filtros)
    public function index(Request $r)
    {
        $user = Auth::user();

        $q = Venta::query()
            ->with(['detalles.producto:id,sku,nombre', 'vendedor:id,nombre'])
            ->where('vendedor_id', $user->id)
            ->orderByDesc('creado_en');

        if ($r->filled('estado'))   $q->where('estado', $r->string('estado'));
        if ($r->filled('desde'))    $q->whereDate('creado_en', '>=', $r->date('desde'));
        if ($r->filled('hasta'))    $q->whereDate('creado_en', '<=', $r->date('hasta'));

        return response()->json(['ventas' => $q->get()]);
    }

    // ADMIN: todas las ventas (con filtros)
    public function adminIndex(Request $r)
    {
        $q = Venta::query()
            ->with(['detalles.producto:id,sku,nombre', 'vendedor:id,nombre'])
            ->orderByDesc('creado_en');

        if ($r->filled('estado'))   $q->where('estado', $r->string('estado'));
        if ($r->filled('vendedor')) $q->where('vendedor_id', $r->integer('vendedor'));
        if ($r->filled('desde'))    $q->whereDate('creado_en', '>=', $r->date('desde'));
        if ($r->filled('hasta'))    $q->whereDate('creado_en', '<=', $r->date('hasta'));

        return response()->json(['ventas' => $q->get()]);
    }

    // Ver una venta (empleado solo sus ventas / admin cualquiera)
    public function show(int $id)
    {
        $venta = Venta::with(['detalles.producto:id,sku,nombre', 'vendedor:id,nombre'])->findOrFail($id);
        $user = Auth::user();
        $esAdmin = in_array(strtoupper(optional($user->rol)->nombre), ['ADMIN','ADMINISTRADOR'], true);

        if (!$esAdmin && $venta->vendedor_id !== $user->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        return response()->json(['venta' => $venta]);
    }

   public function cancelar(Request $r, int $id)
{
    $user = Auth::user();
    $modo = $r->input('modo', 'reponer');  // 'reponer' | 'catalogo'

    return DB::transaction(function () use ($id, $user, $modo) {
        $venta = DB::table('ventas')->where('id', $id)->lockForUpdate()->first();
        if (!$venta) {
            return response()->json(['message' => 'Venta no existe'], 404);
        }

        // Permisos
        $esAdmin = in_array(strtoupper(optional($user->rol)->nombre), ['ADMIN','ADMINISTRADOR'], true);
        if (!$esAdmin && $venta->vendedor_id !== $user->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        if ($venta->estado === 'CANCELADA') {
            return response()->json(['message' => 'Ya estaba cancelada'], 200);
        }
        if ($venta->estado === 'PAGADA') {
            return response()->json(['message' => 'No se puede cancelar una venta pagada'], 422);
        }
        if ($venta->estado !== 'PENDIENTE') {
            return response()->json(['message' => 'Sólo PENDIENTE puede cancelarse'], 422);
        }

        // Procesar cada detalle
        $detalles = DB::table('venta_detalles')->where('venta_id', $id)->get();

        foreach ($detalles as $d) {
            // lock del producto del detalle
            $p = DB::table('productos')->lockForUpdate()->find($d->producto_id);
            if (!$p) continue;

            if ($p->tipo === 'PERSONALIZADA') {
                if ($modo === 'reponer') {
                    // 1) devolver componentes
                    $rows = DB::table('producto_componentes')->where('producto_id',$p->id)->get();
                    foreach ($rows as $row) {
                        DB::table('productos')->where('id',$row->componente_id)->increment('stock', $row->cantidad);
                        DB::table('movimientos_stock')->insert([
                            'producto_id'     => $row->componente_id,
                            'cambio_cantidad' => +$row->cantidad,
                            'motivo'          => 'DEVOLUCION_ENSAMBLE',
                            'referencia_tipo' => 'venta_cancelada',
                            'referencia_id'   => $id,
                        ]);
                    }

                    // 2) borrar hijos del personalizado
                    DB::table('producto_componentes')->where('producto_id',$p->id)->delete();
                    DB::table('movimientos_stock')->where('producto_id',$p->id)->delete();

                    // 3) NO borrar el producto para no violar la FK del detalle
                    DB::table('productos')->where('id',$p->id)->update([
                        'stock' => 0,
                        // opcional, para que no vuelva a aparecer en catálogos:
                        // 'precio' => 0,
                        // 'nombre' => DB::raw("CONCAT(nombre, ' [ANULADA #{$id}]')")
                    ]);

                } else { // 'catalogo' -> mantener PC y devolverla al stock=1
                    DB::table('productos')->where('id',$p->id)->increment('stock', 1);
                    DB::table('movimientos_stock')->insert([
                        'producto_id'     => $p->id,
                        'cambio_cantidad' => +1,
                        'motivo'          => 'CANCELACION_VENTA',
                        'referencia_tipo' => 'venta',
                        'referencia_id'   => $id,
                    ]);
                }
            } else {
                // producto normal: reponer cantidad
                DB::table('productos')->where('id',$p->id)->increment('stock', $d->cantidad);
                DB::table('movimientos_stock')->insert([
                    'producto_id'     => $p->id,
                    'cambio_cantidad' => +$d->cantidad,
                    'motivo'          => 'CANCELACION_VENTA',
                    'referencia_tipo' => 'venta',
                    'referencia_id'   => $id,
                ]);
            }
        }

        DB::table('ventas')->where('id',$id)->update(['estado' => 'CANCELADA']);
        return response()->json(['message' => 'Venta cancelada']);
    });
}




}
