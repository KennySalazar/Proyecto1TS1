<?php

namespace App\Http\Controllers;

use App\Models\Tarea;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TareaController extends Controller
{
    public function index(Request $request)
    {
        $user    = Auth::user();
        $esAdmin = in_array(strtoupper(optional($user->rol)->nombre), ['ADMIN','ADMINISTRADOR'], true);

        $q = Tarea::query()
            ->with(['items.producto:id,sku,nombre'])
            ->select(['id','tipo','asignado_a','datos','estado','vence_en','creado_en','actualizado_en'])
            ->orderByRaw("FIELD(estado,'ABIERTA','EN_PROCESO','TERMINADA','CANCELADA')")
            ->orderByDesc('creado_en');

        if ($request->filled('estado')) $q->where('estado', $request->string('estado'));
        if ($request->filled('tipo'))   $q->where('tipo',   $request->string('tipo'));
        if (!$esAdmin)                  $q->where('asignado_a', $user->id);

        return response()->json(['tareas' => $q->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo'        => 'required|string|in:ENSAMBLAJE',
            'asignado_a'  => 'required|integer|exists:usuarios,id',
            'descripcion' => 'nullable|string',
            'vence_en'    => 'nullable|date',
            'componentes'            => 'required|array|min:1',
            'componentes.*.id'       => 'required|integer|exists:productos,id',
            'componentes.*.cantidad' => 'required|integer|min:1',
        ]);

        $tarea = DB::transaction(function () use ($data) {
            // 1) Crear la tarea
            $t = Tarea::create([
                'tipo'       => 'ENSAMBLAJE',
                'asignado_a' => $data['asignado_a'],
                'datos'      => $data['descripcion'] ?? null,
                'estado'     => 'ABIERTA',
                'vence_en'   => $data['vence_en'] ?? null,
            ]);

            // 2) Reservar componentes (descontar stock) + guardar BOM
            foreach ($data['componentes'] as $row) {
                $p = Producto::lockForUpdate()->find($row['id']);
                if (!$p) abort(422, 'Componente no existe');

                if ($p->stock < $row['cantidad']) {
                    abort(422, "Stock insuficiente para {$p->sku} ({$p->nombre}). Disponible: {$p->stock}");
                }

                DB::table('tarea_componentes')->insert([
                    'tarea_id'      => $t->id,
                    'componente_id' => $p->id,
                    'cantidad'      => $row['cantidad'],
                ]);

                // Descontar (reserva)
                $p->decrement('stock', $row['cantidad']);

                // Movimiento de auditoría
                DB::table('movimientos_stock')->insert([
                    'producto_id'     => $p->id,
                    'cambio_cantidad' => -$row['cantidad'],
                    'motivo'          => 'RESERVA_ENSAMBLE',
                    'referencia_tipo' => 'tarea',
                    'referencia_id'   => $t->id,
                ]);
            }

            return $t;
        });

        return response()->json(['message' => 'Tarea creada', 'tarea' => $tarea], 201);
    }

    public function actEstado(Request $request, int $id)
    {
        $request->validate(['estado'=>'required|string|in:ABIERTA,EN_PROCESO,TERMINADA,CANCELADA']);

        $t = Tarea::with('items.producto')->findOrFail($id);
        $user = Auth::user();
        $esAdmin = in_array(strtoupper(optional($user->rol)->nombre), ['ADMIN','ADMINISTRADOR'], true);

        if (!$esAdmin && $t->asignado_a !== $user->id) {
            return response()->json(['message'=>'No autorizado'],403);
        }

        $allowed = [
            'ABIERTA'    => ['EN_PROCESO','CANCELADA'],
            'EN_PROCESO' => ['TERMINADA','CANCELADA'],
            'TERMINADA'  => [],
            'CANCELADA'  => [],
        ];
        $nuevo  = strtoupper($request->string('estado'));
        $actual = strtoupper($t->estado);

        if (!in_array($nuevo, $allowed[$actual] ?? [], true)) {
            return response()->json(['message'=>"Transición inválida de $actual a $nuevo"],422);
        }

        // Si la cancela, devolver stock y dejar la traza
        if ($nuevo === 'CANCELADA') {
            DB::transaction(function () use ($t) {
                foreach ($t->items as $it) {
                    $p = Producto::lockForUpdate()->find($it->componente_id);
                    if (!$p) continue;

                    $p->increment('stock', $it->cantidad);

                    DB::table('movimientos_stock')->insert([
                        'producto_id'     => $p->id,
                        'cambio_cantidad' =>  $it->cantidad,
                        'motivo'          => 'DEVOLUCION_ENSAMBLE',
                        'referencia_tipo' => 'tarea',
                        'referencia_id'   => $t->id,
                    ]);
                }
            });
        }

        $t->estado = $nuevo;
        $t->save();

        return response()->json(['message'=>'Estado actualizado','tarea'=>$t]);
    }
}
