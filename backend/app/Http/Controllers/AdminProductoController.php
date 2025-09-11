<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Producto;
use App\Models\Categoria;
use App\Models\PcCategoria;
use Illuminate\Support\Facades\DB; 

class AdminProductoController extends Controller
{
    // Categorías de componentes
public function listarCategoriasComponentes()
{
    // Traer todas las categorías tal cual de la tabla
    $cats = Categoria::select('id','nombre','descripcion')->get();

    return response()->json([
        'categorias' => $cats
    ]);
}




    // Categorías de PCs (prearmadas)sortBy
    public function listarCategoriasPC()
    {
        return response()->json([
            'categorias' => PcCategoria::orderBy('nombre')->get(['id','nombre','descripcion'])
        ]);
    }

    // Lista de componentes disponibles para BOM (stock > 0)
    public function listarComponentesParaBom(Request $r)
    {
        $search = trim((string)$r->input('search',''));

        $q = Producto::query()
            ->select(['id','sku','nombre','marca','modelo','stock'])
            ->where('tipo','COMPONENTE')
            ->where('stock','>',0);

        if ($search !== '') {
            $like = "%{$search}%";
            $q->where(function($w) use ($like) {
                $w->where('sku','like',$like)
                  ->orWhere('nombre','like',$like)
                  ->orWhere('marca','like',$like)
                  ->orWhere('modelo','like',$like);
            });
        }

        return response()->json([
            'componentes' => $q->orderBy('nombre')->limit(1000)->get()
        ]);
    }

    // Crear componente
    public function crearComponente(Request $request)
    {
        $data = $request->validate([
            'sku'             => 'required|string|max:40|unique:productos,sku',
            'nombre'          => 'required|string|max:160',
            'marca'           => 'nullable|string|max:80',
            'modelo'          => 'nullable|string|max:80',
            'descripcion'     => 'nullable|string',
            'especificaciones'=> 'nullable|string',
            'categoria_id'    => 'required|exists:categorias,id',
            'precio'          => 'required|numeric|min:0',
            'stock'           => 'required|integer|min:0',
        ]);

        $p = Producto::create(array_merge($data, [
            'tipo' => 'COMPONENTE',
        ]));

        return response()->json(['message'=>'Componente creado','producto'=>$p], 201);
    }

    // Crear prearmada
    public function crearPrearmada(Request $request)
    {
        $data = $request->validate([
            'sku'             => 'required|string|max:40|unique:productos,sku',
            'nombre'          => 'required|string|max:160',
            'marca'           => 'nullable|string|max:80',
            'modelo'          => 'nullable|string|max:80',
            'descripcion'     => 'nullable|string',
            'especificaciones'=> 'nullable|string',
            'pc_categoria_id' => 'required|exists:pc_categorias,id',
            'precio'          => 'required|numeric|min:0',
            'stock'           => 'required|integer|min:0',
        ]);

        $p = Producto::create(array_merge($data, [
            'tipo' => 'PREARMADA',
        ]));

        return response()->json(['message'=>'Prearmada creada','producto'=>$p], 201);
    }
}

