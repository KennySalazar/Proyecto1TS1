<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'correo'   => 'required|email',
            'password' => 'required|string',
        ]);

        $user = Usuario::with('rol')->where('correo', $data['correo'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }
        if ($user->estado !== 'ACTIVO') {
            return response()->json(['message' => 'Usuario inactivo'], 403);
        }

        $token = $user->createToken('web')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'     => $user->id,
                'nombre' => $user->nombre,
                'correo' => $user->correo,
                'rol'    => $user->rol->nombre ?? null,
            ]
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('rol');
        return response()->json([
            'id'     => $user->id,
            'nombre' => $user->nombre,
            'correo' => $user->correo,
            'rol'    => $user->rol->nombre ?? null,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['message' => 'Sesión cerrada']);
    }
}
