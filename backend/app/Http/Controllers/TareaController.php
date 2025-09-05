<?php

namespace App\Http\Controllers;

use App\Models\Tarea;
use App\Models\TareaComponente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class TareaController extends Controller
{

public function index(Request $request)
{
    $user    = Auth::user();
    $esAdmin = in_array(strtoupper(optional($user->rol)->nombre), ['ADMIN','ADMINISTRADOR'], true);

    $q = Tarea::query()
        ->with(['items.producto:id,sku,nombre'])
        // 👇 selecciona explícitamente los campos (incluye 'datos')
        ->select([
            'id','tipo','asignado_a','datos','estado','vence_en',
            'creado_en','actualizado_en'
        ])
        ->orderByRaw("FIELD(estado,'ABIERTA','EN_PROCESO','TERMINADA','CANCELADA')")
        ->orderByDesc('creado_en');

    if ($request->filled('estado')) {
        $q->where('estado', $request->string('estado'));
    }
    if ($request->filled('tipo')) {
        $q->where('tipo', $request->string('tipo'));
    }
    if (!$esAdmin) {
        $q->where('asignado_a', $user->id);
    }

    return response()->json(['tareas' => $q->get()]);
}


public function store(Request $request)
{
    // Solo ENSAMBLAJE
    $data = $request->validate([
        'tipo'        => 'required|string|in:ENSAMBLAJE',
        'asignado_a'  => 'required|integer|exists:usuarios,id',
        'descripcion' => 'nullable|string',       // <-- texto, va a tareas.datos
        'vence_en'    => 'nullable|date',

        // BOM
        'componentes'              => 'required|array|min:1',
        'componentes.*.id'         => 'required|integer|exists:productos,id',
        'componentes.*.cantidad'   => 'required|integer|min:1',
    ]);

    // crear la tarea
    $t = \App\Models\Tarea::create([
        'tipo'       => 'ENSAMBLAJE',
        'asignado_a' => $data['asignado_a'],
        'datos'      => $data['descripcion'] ?? null,   // <-- SOLO texto
        'estado'     => 'ABIERTA',
        'vence_en'   => $data['vence_en'] ?? null,
    ]);

    // insertar BOM en tarea_componentes
    foreach ($data['componentes'] as $row) {
        \DB::table('tarea_componentes')->insert([
            'tarea_id'      => $t->id,
            'componente_id' => $row['id'],
            'cantidad'      => $row['cantidad'],
        ]);
    }

    return response()->json(['message' => 'Tarea creada', 'tarea' => $t], 201);
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

        $t->estado = $nuevo;
        $t->save();

        return response()->json(['message'=>'Estado actualizado','tarea'=>$t]);
    }
}
