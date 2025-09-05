<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Producto;

class CatalogoController extends Controller
{
    // GET /catalogo/productos?tipo=COMPONENTE|PREARMADA&search=..&pc_categoria_id=..
    public function index(Request $r)
    {
        $tipo          = $r->input('tipo');         
        $search        = trim((string) $r->input('search', ''));
        $pcCategoriaId = $r->input('pc_categoria_id');

        $q = Producto::query()
            ->with(['categoria:id,nombre','pcCategoria:id,nombre'])
            ->select([
                'id','sku','nombre','marca','modelo',
                'descripcion','especificaciones',
                'tipo','categoria_id','pc_categoria_id',
                'precio','stock'
            ])
            ->where('stock', '>', 0);

        if ($tipo) {
            $q->where('tipo', $tipo);
        } else {
            $q->whereIn('tipo', ['COMPONENTE', 'PREARMADA']);
        }

        if ($pcCategoriaId) {
            $q->where('pc_categoria_id', $pcCategoriaId);
        }

        if ($search !== '') {
            $like = "%{$search}%";
            $q->where(function ($w) use ($like) {
                $w->where('sku', 'like', $like)
                  ->orWhere('nombre', 'like', $like)
                  ->orWhere('marca', 'like', $like)
                  ->orWhere('modelo', 'like', $like)
                  ->orWhere('descripcion', 'like', $like)
                  ->orWhere('especificaciones', 'like', $like);
            });
        }

        return response()->json(['items' => $q->orderBy('nombre')->get()]);
    }
}