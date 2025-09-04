<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    protected $table = 'productos';

    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    protected $fillable = [
        'sku','nombre','descripcion','tipo','categoria_id',
        'precio','costo','stock','stock_minimo','estado'
    ];

    // Ayudas para tipo
    public const TIPO_COMPONENTE   = 'COMPONENTE';
    public const TIPO_PREARMADA    = 'PREARMADA';
    public const TIPO_PERSONALIZADA= 'PERSONALIZADA';

    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }
}
