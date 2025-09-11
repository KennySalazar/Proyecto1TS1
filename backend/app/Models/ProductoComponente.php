<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ProductoComponente extends Model
{
    protected $table = 'producto_componentes';
    public $timestamps = false;
    protected $fillable = ['producto_id','componente_id','cantidad'];

    public function producto()   { return $this->belongsTo(Producto::class, 'producto_id'); }
    public function componente() { return $this->belongsTo(Producto::class, 'componente_id'); }
}
