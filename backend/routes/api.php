<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\TareaController;
use App\Http\Controllers\AdminProductoController;
use App\Http\Controllers\CatalogoController;
use App\Http\Middleware\IsAdmin;
use App\Http\Controllers\VentaController;

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

        Route::get('/admin/ventas',      [VentaController::class, 'adminIndex']);  // todas
        Route::get('/admin/ventas/{id}', [VentaController::class, 'show']);       // detalle
    });

    // Catálogo visible para empleados (y admin si quieres probar)
    Route::get('/catalogo/productos', [CatalogoController::class, 'index']);

    // Tareas (empleado / admin)
    Route::get('/tareas',               [TareaController::class, 'index']);
    Route::patch('/tareas/{id}/estado', [TareaController::class, 'actEstado']);

    // Empleado
    Route::get('/ventas',        [VentaController::class, 'index']);
    Route::get('/ventas/{id}',   [VentaController::class, 'show']);
    Route::post('/ventas',       [VentaController::class, 'store']);
    Route::post('/ventas/{id}/pagar', [VentaController::class, 'pagar']);
    Route::post('/ventas/{id}/cancelar',[VentaController::class, 'cancelar']);

    // Admin
    Route::get('/admin/ventas',      [VentaController::class, 'adminIndex']);
    Route::get('/admin/ventas/{id}', [VentaController::class, 'show']);
});
