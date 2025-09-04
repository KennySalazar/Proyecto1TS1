<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Throwable;

class UsuarioController extends Controller
{
public function crearEmpleado(Request $request)
{
    $empleadoRole = \App\Models\Role::where('nombre', 'EMPLEADO')->first();
    if (!$empleadoRole) {
        return response()->json(['message' => 'Rol EMPLEADO no existe'], 500);
    }

    try {
        $data = $request->validate([
            'nombre'          => 'required|string|max:120',
            'correo'          => 'required|email|max:120|unique:usuarios,correo',
            'codigo_empleado' => 'nullable|string|max:30|unique:usuarios,codigo_empleado',
            'password'        => 'nullable|string|min:6',
            'estado'          => 'nullable|in:ACTIVO,INACTIVO',
        ]);

        $passwordPlano = $data['password'] ?? str()->random(10);

        $user = \App\Models\Usuario::create([
            'rol_id'          => $empleadoRole->id,
            'codigo_empleado' => $data['codigo_empleado'] ?? null,
            'nombre'          => $data['nombre'],
            'correo'          => $data['correo'],
            'password'        => \Illuminate\Support\Facades\Hash::make($passwordPlano),
            'estado'          => $data['estado'] ?? 'ACTIVO',
        ]);

        return response()->json([
            'message' => 'Empleado creado',
            'empleado' => [
                'id'     => $user->id,
                'nombre' => $user->nombre,
                'correo' => $user->correo,
                'codigo' => $user->codigo_empleado,
                'rol'    => 'EMPLEADO',
            ],
            'password_clara' => $data['password'] ? null : $passwordPlano
        ], 201);

    } catch (\Illuminate\Validation\ValidationException $ve) {
        return response()->json([
            'message' => 'Datos inválidos',
            'errors'  => $ve->errors(),
        ], 422);
    } catch (\Throwable $e) {
        \Log::error('storeEmpleado 500', ['msg'=>$e->getMessage()]);
        return response()->json(['message' => 'Error interno: '.$e->getMessage()], 500);
    }
}

  public function listarEmpleados(Request $request)
    {
        $perPage = (int) ($request->input('per_page', 10));
        $search  = trim((string) $request->input('search', ''));

        $q = Usuario::query()
            ->with('rol')
            ->whereHas('rol', fn($r) => $r->where('nombre', 'EMPLEADO'));

        if ($search !== '') {
            $q->where(function ($qq) use ($search) {
                $qq->where('nombre', 'like', "%{$search}%")
                  ->orWhere('correo', 'like', "%{$search}%")
                  ->orWhere('codigo_empleado', 'like', "%{$search}%");
            });
        }

        $empleados = $q->orderBy('id', 'desc')->paginate($perPage);

        
        return response()->json($empleados);
    }

    // PATCH /api/empleados/{id}/estado
    public function actDesEstado($id)
    {
        $empleado = Usuario::with('rol')
            ->whereHas('rol', fn($r) => $r->where('nombre', 'EMPLEADO'))
            ->findOrFail($id);

        $empleado->estado = $empleado->estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        $empleado->save();

        return response()->json([
            'message' => 'Estado actualizado',
            'id'      => $empleado->id,
            'estado'  => $empleado->estado,
        ]);
    }
}


