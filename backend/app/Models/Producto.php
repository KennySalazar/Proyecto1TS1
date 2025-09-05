<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    use HasFactory;

    protected $table = 'productos';

    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    protected $fillable = [
        'sku',
        'nombre',
        'marca',
        'modelo',
        'descripcion',
        'especificaciones',
        'tipo',            // COMPONENTE, PREARMADA, PERSONALIZADA
        'categoria_id',    // para componentes
        'pc_categoria_id', // para prearmadas
        'precio',
        'stock',
    ];

    // Relaciones
    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    public function pcCategoria()
    {
        return $this->belongsTo(PcCategoria::class, 'pc_categoria_id');
    }
}