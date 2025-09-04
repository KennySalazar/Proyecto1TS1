<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tarea extends Model
{
    protected $table = 'tareas';

    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    protected $fillable = [
        'tipo',
        'asignado_a',
        'datos',        
        'estado',
        'vence_en',
    ];

    protected $casts = [
        'vence_en' => 'datetime',
    ];

    public function empleado()
    {
        return $this->belongsTo(Usuario::class, 'asignado_a'); 
    }
}