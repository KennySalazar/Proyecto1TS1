<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\TareaController;
use App\Http\Controllers\AdminProductoController;
use App\Http\Controllers\CatalogoController;
use App\Http\Middleware\IsAdmin;
use App\Http\Controllers\VentaController;
use App\Http\Controllers\PersonalizadaController;
use App\Http\Controllers\ComponentesController;

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
        Route::get('/admin/categorias',        [AdminProductoController::class, 'listarCategoriasComponentes']);
        Route::get('/admin/pc-categorias',     [AdminProductoController::class, 'listarCategoriasPC']);
        Route::post('/admin/componentes',      [AdminProductoController::class, 'crearComponente']);
        Route::post('/admin/prearmadas',       [AdminProductoController::class, 'crearPrearmada']);
        Route::get('/admin/componentes/lista', [AdminProductoController::class, 'listarComponentesParaBom']);

        // Tareas (solo ENSAMBLAJE)
        Route::post('/tareas', [TareaController::class, 'store']);

        // Ventas (admin)
        Route::get('/admin/ventas',      [VentaController::class, 'adminIndex']);
        Route::get('/admin/ventas/{id}', [VentaController::class, 'show']);
    });

    // Catálogo visible
    Route::get('/catalogo/productos', [CatalogoController::class, 'index']);

    // Tareas (empleado / admin)
    Route::get('/tareas',               [TareaController::class, 'index']);
    Route::patch('/tareas/{id}/estado', [TareaController::class, 'actEstado']);

    // Ventas (empleado)
    Route::get('/ventas',              [VentaController::class, 'index']);
    Route::get('/ventas/{id}',         [VentaController::class, 'show']);
    Route::post('/ventas',             [VentaController::class, 'store']);
    Route::post('/ventas/{id}/pagar',  [VentaController::class, 'pagar']);
    Route::post('/ventas/{id}/cancelar',[VentaController::class, 'cancelar']); // <-- una sola

    // PC personalizada (empleado)
    Route::get('/componentes/por-categoria', [ComponentesController::class, 'porCategoria']);
    Route::post('/personalizadas/vender',    [PersonalizadaController::class, 'crearYVender']);
    Route::post('/personalizadas/previsualizar', [PersonalizadaController::class, 'previsualizar']);

});
