<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TareaComponente extends Model
{
    protected $table = 'tarea_componentes';
    public $timestamps = false;

    protected $fillable = ['tarea_id','componente_id','cantidad'];

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'componente_id'); // usa tu modelo de productos
    }
}

