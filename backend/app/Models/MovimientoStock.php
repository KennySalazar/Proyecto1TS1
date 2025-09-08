<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimientoStock extends Model
{
    protected $table = 'movimientos_stock';
    public $timestamps = false;

    protected $fillable = [
        'producto_id','cambio_cantidad','motivo',
        'referencia_tipo','referencia_id'
    ];
}
