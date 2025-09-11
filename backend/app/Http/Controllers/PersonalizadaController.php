<?php
namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PersonalizadaController extends Controller
{
    // categorías mínimas 
    private array $reqCats = ['CPU','RAM','ALMACENAMIENTO','PSU','GABINETE'];

    public function crearYVender(Request $r)
    {
        $data = $r->validate([
            'nombre'       => 'required|string|max:160',
            'cliente_nombre' => 'required|string|max:160',
            'cliente_correo' => 'nullable|email|max:160',
            'componentes'  => 'required|array|min:1',
            'componentes.*.id'       => 'required|integer|exists:productos,id',
            'componentes.*.cantidad' => 'required|integer|min:1',
        ]);

        $userId = Auth::id();

        return DB::transaction(function () use ($data, $userId) {
            // 1) Traer componentes con lock + validar receta (case-insensitive)
            $rows = [];
            $catsPresentes = [];

            foreach ($data['componentes'] as $row) {
                $p = Producto::lockForUpdate()->find($row['id']);
                if (!$p || $p->tipo !== 'COMPONENTE') {
                    abort(422, "El item {$row['id']} no es un componente válido.");
                }
                if ($p->stock < $row['cantidad']) {
                    abort(422, "Stock insuficiente para {$p->sku} ({$p->nombre}). Disp: {$p->stock}");
                }

                $catName = DB::table('categorias')->where('id',$p->categoria_id)->value('nombre') ?? 'OTROS';
                $catsPresentes[mb_strtoupper($catName)] = true;

                $rows[] = ['p'=>$p, 'cant'=>$row['cantidad']];
            }

            foreach ($this->reqCats as $cat) {
                if (empty($catsPresentes[$cat])) abort(422, "Falta {$cat}");
            }

            // 2) Precio = suma de componentes (sin margen)
            $precioFinal = 0;
            foreach ($rows as $r) $precioFinal += $r['p']->precio * $r['cant'];
            $precioFinal = round($precioFinal, 2);

            // 3) Crear producto PERSONALIZADA (stock 1) + consumir componentes
            $sku = $this->nuevoSkuPersonalizada();
            $productoId = DB::table('productos')->insertGetId([
                'sku'         => $sku,
                'nombre'      => $data['nombre'],
                'tipo'        => 'PERSONALIZADA',
                'precio'      => $precioFinal,
                'stock'       => 1,
            ]);

            foreach ($rows as $r) {
                DB::table('producto_componentes')->insert([
                    'producto_id'   => $productoId,
                    'componente_id' => $r['p']->id,
                    'cantidad'      => $r['cant'],
                ]);
                $r['p']->decrement('stock', $r['cant']);

                DB::table('movimientos_stock')->insert([
                    'producto_id'     => $r['p']->id,
                    'cambio_cantidad' => -$r['cant'],
                    'motivo'          => 'CONSUMO_ENSAMBLE',
                    'referencia_tipo' => 'producto_personalizado',
                    'referencia_id'   => $productoId,
                ]);
            }

            // producción +1 (queda en catálogo si más tarde se cancela la venta)
            DB::table('movimientos_stock')->insert([
                'producto_id'     => $productoId,
                'cambio_cantidad' => +1,
                'motivo'          => 'PRODUCCION_ENSAMBLE',
                'referencia_tipo' => 'producto_personalizado',
                'referencia_id'   => $productoId,
            ]);

            // 4) Crear la VENTA con ese producto
            $ventaId = DB::table('ventas')->insertGetId([
                'cliente_nombre' => $data['cliente_nombre'],
                'cliente_correo' => $data['cliente_correo'] ?? null,
                'vendedor_id'    => $userId,
                'estado'         => 'PENDIENTE',
                'total'          => $precioFinal,
            ]);

            DB::table('venta_detalles')->insert([
                'venta_id'    => $ventaId,
                'producto_id' => $productoId,
                'cantidad'    => 1,
                'precio'      => $precioFinal,
                'subtotal'    => $precioFinal,
            ]);

            // descuento inmediato por “venta pendiente”
            DB::table('productos')->where('id',$productoId)->decrement('stock', 1);
            DB::table('movimientos_stock')->insert([
                'producto_id'     => $productoId,
                'cambio_cantidad' => -1,
                'motivo'          => 'VENTA',
                'referencia_tipo' => 'venta',
                'referencia_id'   => $ventaId,
            ]);

            // 5) Respuesta
            $venta = DB::table('ventas')->where('id',$ventaId)->first();
            $det   = DB::table('venta_detalles as d')
                        ->join('productos as p','p.id','=','d.producto_id')
                        ->select('d.id','d.producto_id','p.sku','p.nombre','d.cantidad','d.precio','d.subtotal')
                        ->where('d.venta_id',$ventaId)->get();

            return response()->json([
                'message' => 'PC creada y venta generada',
                'venta'   => $venta,
                'detalles'=> $det,
            ], 201);
        });
    }

    private function nuevoSkuPersonalizada(): string
    {
        // PPC-YYMM-0001
        $base = 'PPC-'.date('ym');
        $seq  = DB::table('productos')->where('sku','LIKE',$base.'%')->count() + 1;
        return sprintf('%s-%04d', $base, $seq);
    }


public function previsualizar(Request $r)
{
    // Validación idéntica a vender, pero sin tocar stock ni crear registros
    $data = $r->validate([
        'nombre'                => 'required|string|max:160',
        'cliente_nombre'        => 'required|string|max:160',
        'cliente_correo'        => 'nullable|email|max:160',
        'componentes'           => 'required|array|min:1',
        'componentes.*.id'      => 'required|integer|exists:productos,id',
        'componentes.*.cantidad'=> 'required|integer|min:1',
    ]);

    // Reglas de categorías obligatorias (mismas que usas en crearYVender)
    $reqCats = ['CPU','RAM','ALMACENAMIENTO','PSU','GABINETE'];

    // Trae los productos referenciados por ID en un solo query
    $ids = collect($data['componentes'])->pluck('id')->unique()->values();
    $prods = DB::table('productos as p')
        ->leftJoin('categorias as c','c.id','=','p.categoria_id')
        ->whereIn('p.id', $ids)
        ->select(
            'p.id','p.sku','p.nombre','p.precio','p.stock','p.tipo',
            'p.categoria_id','c.nombre as categoria'
        )->get()->keyBy('id');

    // Armar filas normalizadas + validaciones de stock y categorías
    $rows = [];
    $catsPresentes = [];

    foreach ($data['componentes'] as $row) {
        $p = $prods[$row['id']] ?? null;
        if (!$p) abort(422, "El item {$row['id']} no existe.");

        if ($p->tipo !== 'COMPONENTE') {
            abort(422, "El item {$p->sku} no es un componente válido.");
        }

        $cant = (int)$row['cantidad'];
        if ($cant < 1) abort(422, "Cantidad inválida para {$p->sku}.");

        if ($p->stock < $cant) {
            abort(422, "Stock insuficiente para {$p->sku} — disp: {$p->stock}");
        }

        $catName = mb_strtoupper($p->categoria ?? 'OTROS');
        $catsPresentes[$catName] = true;

        $rows[] = [
            'id'        => $p->id,
            'sku'       => $p->sku,
            'nombre'    => $p->nombre,
            'precio'    => (float)$p->precio,
            'stock'     => (int)$p->stock,
            'categoria' => $catName,
            'cantidad'  => $cant,
            'subtotal'  => round((float)$p->precio * $cant, 2),
        ];
    }

    // Validar categorías obligatorias
    foreach ($reqCats as $cat) {
        if (empty($catsPresentes[$cat])) {
            abort(422, "Falta {$cat}");
        }
    }

    // Mínimos (RAM y ALMACENAMIENTO al menos 1 unidad)
    $sum = function(string $catKey) use ($rows) {
        return collect($rows)->where('categoria', strtoupper($catKey))
                             ->sum('cantidad');
    };
    if ($sum('RAM') < 1)             abort(422, 'Debe llevar al menos 1 módulo de RAM');
    if ($sum('ALMACENAMIENTO') < 1)  abort(422, 'Debe llevar al menos 1 unidad de almacenamiento');

    // Total
    $total = round(collect($rows)->sum('subtotal'), 2);

    return response()->json([
        'ok'          => true,
        'total'       => $total,
        'componentes' => $rows,
        'resumen'     => [
            'nombre_pc'       => $data['nombre'],
            'cliente_nombre'  => $data['cliente_nombre'],
            'cliente_correo'  => $data['cliente_correo'] ?? null,
        ],
    ]);
}

}
