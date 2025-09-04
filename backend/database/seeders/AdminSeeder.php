<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::where('nombre', 'ADMINISTRADOR')->first();

        Usuario::firstOrCreate(
            ['correo' => 'admin@example.com'],
            [
                'rol_id' => $adminRole->id,
                'codigo_empleado' => null,
                'nombre' => 'Administrador',
                'password' => Hash::make('password'), // password
                'estado' => 'ACTIVO',
            ]
        );
    }
}
