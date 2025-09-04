<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    // middleware globales (déjalos como estén)
    protected $middleware = [
        // ...
    ];

    // ← ESTE es el arreglo correcto para alias de middleware
protected $middlewareAliases = [
    'auth' => \App\Http\Middleware\Authenticate::class,
    'is_admin' => \App\Http\Middleware\IsAdmin::class,
    // ...
];
    // Si tu proyecto aún usa estas pilas, déjalas
    protected $middlewareGroups = [
        'web' => [
            // ...
        ],
        'api' => [
            // ...
        ],
    ];
}
