<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\TareaController;
use App\Http\Controllers\AdminProductoController;
use App\Http\Controllers\CatalogoController;
use App\Http\Middleware\IsAdmin;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    // Sesión
    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // SOLO ADMIN
    Route::middleware(IsAdmin::class)->group(function () {
        // Empleados
        Route::get('/empleados',               [UsuarioController::class, 'listarEmpleados']);
        Route::post('/empleados',              [UsuarioController::class, 'crearEmpleado']);
        Route::patch('/empleados/{id}/estado', [UsuarioController::class, 'actDesEstado']);

        // Catálogo de administración
        Route::get('/admin/categorias',        [AdminProductoController::class, 'listarCategoriasComponentes']); // categorías de componentes
        Route::get('/admin/pc-categorias',     [AdminProductoController::class, 'listarCategoriasPC']);          // categorías de PCs
        Route::post('/admin/componentes',      [AdminProductoController::class, 'crearComponente']);              // componente
        Route::post('/admin/prearmadas',       [AdminProductoController::class, 'crearPrearmada']);               // prearmada sin BOM
        Route::get('/admin/componentes/lista', [AdminProductoController::class, 'listarComponentesParaBom']);    // <-- LISTA DE COMPONENTES PARA TAREAS (BOM)

        // Tareas (solo ENSAMBLAJE)
        Route::post('/tareas', [TareaController::class, 'store']);
    });

    // Catálogo visible para empleados (y admin si quieres probar)
    Route::get('/catalogo/productos', [CatalogoController::class, 'index']);

    // Tareas (empleado / admin)
    Route::get('/tareas',               [TareaController::class, 'index']);
    Route::patch('/tareas/{id}/estado', [TareaController::class, 'actEstado']);
});
