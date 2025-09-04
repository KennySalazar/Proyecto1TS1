<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\TareaController;
use App\Http\Controllers\AdminProductoController; 
use App\Http\Middleware\IsAdmin;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    // --- Sesión ---
    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- SOLO ADMIN ---
    Route::middleware(IsAdmin::class)->group(function () {

        // Empleados
        Route::get('/empleados',               [UsuarioController::class, 'listarEmpleados']);
        Route::post('/empleados',              [UsuarioController::class, 'crearEmpleado']);
        Route::patch('/empleados/{id}/estado', [UsuarioController::class, 'actDesEstado']);

        // Productos / Catálogos
        Route::get('/admin/categorias',  [AdminProductoController::class, 'listarCategorias']);
        Route::get('/admin/componentes', [AdminProductoController::class, 'listarComponentes']);
        Route::post('/admin/componentes',[AdminProductoController::class, 'crearComponente']);
        Route::post('/admin/prearmadas', [AdminProductoController::class, 'crearPrearmada']);

        // Tareas (crear para empleados)
        Route::post('/tareas', [TareaController::class, 'store']);
    });

    // --- Tareas (empleado y admin) ---
    Route::get('/tareas',                 [TareaController::class, 'index']);
    Route::patch('/tareas/{id}/estado',   [TareaController::class, 'actEstado']);
});
