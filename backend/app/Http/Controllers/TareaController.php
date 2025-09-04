<?php

namespace App\Http\Controllers;

use App\Models\Tarea;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TareaController extends Controller
{
public function index(Request $request)
{
    $user    = Auth::user();
    $esAdmin = in_array(strtoupper(optional($user->rol)->nombre), ['ADMIN','ADMINISTRADOR'], true);

    $q = Tarea::query()
        ->with(['empleado:id,nombre,correo'])   // útil para depurar/mostrar
        ->orderByRaw("FIELD(estado,'ABIERTA','EN_PROCESO','TERMINADA','CANCELADA')")
        ->orderByDesc('creado_en');

    // filtros opcionales
    if ($request->filled('tipo'))   $q->where('tipo',   $request->input('tipo'));
    if ($request->filled('estado')) $q->where('estado', $request->input('estado'));

    // si NO es admin → solo sus tareas
    if (!$esAdmin) {
        $q->where('asignado_a', $user->id);
    }

    return response()->json(['tareas' => $q->get()]);
}

    // SOLO ADMIN
public function store(Request $request)
{
    $data = $request->validate([
        'tipo'       => 'required|string|in:VENTA,ENSAMBLAJE',
        'asignado_a' => 'required|integer|exists:usuarios,id',
        'datos'      => 'nullable|string|max:200', // ahora string simple
        'vence_en'   => 'nullable|date'
    ]);

    $t = Tarea::create([
        'tipo'       => $data['tipo'],
        'asignado_a' => $data['asignado_a'],
        'datos'      => $data['datos'] ?? null,
        'estado'     => 'ABIERTA',
        'vence_en'   => $data['vence_en'] ?? null,
    ]);

    return response()->json(['message' => 'Tarea creada', 'tarea' => $t], 201);
}


    public function actEstado(Request $request, int $id)
    {
        $request->validate(['estado'=>'required|string|in:ABIERTA,EN_PROCESO,TERMINADA,CANCELADA']);
        $t = Tarea::findOrFail($id);
        $user = Auth::user();

        $rol = strtoupper($user->rol->nombre ?? '');
        $esAdmin = in_array($rol, ['ADMIN','ADMINISTRADOR']);
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
