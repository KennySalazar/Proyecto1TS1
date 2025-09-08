<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    protected $table = 'ventas';
    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    protected $fillable = [
        'cliente_nombre','cliente_correo','vendedor_id','estado','total'
    ];

    // Relación con el vendedor (usuarios)
    public function vendedor()
    {
        return $this->belongsTo(Usuario::class, 'vendedor_id');
    }

    // Detalles de la venta
    public function detalles()
    {
        return $this->hasMany(VentaDetalle::class, 'venta_id');
    }
}
