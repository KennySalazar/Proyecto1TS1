<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PcCategoria extends Model
{
    protected $table = 'pc_categorias';
    public $timestamps = false;

    protected $fillable = ['nombre', 'descripcion'];
}
