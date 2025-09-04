<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminProductoController extends Controller
{
    // POST /api/admin/componentes
    public function crearComponente(Request $r)
    {
        $data = $r->validate([
            'sku'          => 'required|string|max:40|unique:productos,sku',
            'nombre'       => 'required|string|max:160',
            'descripcion'  => 'nullable|string',
            'categoria_id' => 'required|integer|exists:categorias,id',
            'precio'       => 'required|numeric|min:0',
            'costo'        => 'required|numeric|min:0',
            'stock'        => 'required|integer|min:0',
            'stock_minimo' => 'required|integer|min:0',
            'estado'       => ['nullable','string', Rule::in(['ACTIVO','INACTIVO'])],
        ]);

        $p = Producto::create([
            'sku'          => $data['sku'],
            'nombre'       => $data['nombre'],
            'descripcion'  => $data['descripcion'] ?? null,
            'tipo'         => Producto::TIPO_COMPONENTE,
            'categoria_id' => $data['categoria_id'],
            'precio'       => $data['precio'],
            'costo'        => $data['costo'],
            'stock'        => $data['stock'],
            'stock_minimo' => $data['stock_minimo'],
            'estado'       => $data['estado'] ?? 'ACTIVO',
        ]);

        return response()->json(['message'=>'Componente creado','producto'=>$p],201);
    }

    // POST /api/admin/prearmadas
    // Recibe: sku, nombre, descripcion?, precio, costo, stock, stock_minimo, estado?, bom:[{componente_id,cantidad}]
    public function crearPrearmada(Request $r)
    {
        $data = $r->validate([
            'sku'          => 'required|string|max:40|unique:productos,sku',
            'nombre'       => 'required|string|max:160',
            'descripcion'  => 'nullable|string',
            'precio'       => 'required|numeric|min:0',
            'costo'        => 'required|numeric|min:0',
            'stock'        => 'required|integer|min:0',
            'stock_minimo' => 'required|integer|min:0',
            'estado'       => ['nullable','string', Rule::in(['ACTIVO','INACTIVO'])],
            'bom'          => 'required|array|min:1',
            'bom.*.componente_id' => [
                'required','integer','distinct',
                Rule::exists('productos','id')->where(fn($q)=>$q->where('tipo','COMPONENTE'))
            ],
            'bom.*.cantidad' => 'required|integer|min:1',
        ]);

        return DB::transaction(function() use ($data) {
            $pre = Producto::create([
                'sku'          => $data['sku'],
                'nombre'       => $data['nombre'],
                'descripcion'  => $data['descripcion'] ?? null,
                'tipo'         => Producto::TIPO_PREARMADA,
                'categoria_id' => null,
                'precio'       => $data['precio'],
                'costo'        => $data['costo'],
                'stock'        => $data['stock'],
                'stock_minimo' => $data['stock_minimo'],
                'estado'       => $data['estado'] ?? 'ACTIVO',
            ]);

            // Insertar BOM
            $rows = [];
            foreach ($data['bom'] as $i) {
                $rows[] = [
                    'producto_id'   => $pre->id,
                    'componente_id' => $i['componente_id'],
                    'cantidad'      => $i['cantidad'],
                ];
            }
            DB::table('recetas_prearmadas')->insert($rows);

            return response()->json([
                'message'=>'PC prearmada creada',
                'producto'=>$pre,
                'bom'=>$rows
            ],201);
        });
    }

    // GET /api/admin/categorias
    public function listarCategorias()
    {
        return response()->json(['categorias'=>Categoria::orderBy('nombre')->get()]);
    }

    // GET /api/admin/componentes (para seleccionar en el BOM)
    public function listarComponentes()
    {
        $list = Producto::where('tipo', Producto::TIPO_COMPONENTE)
                ->orderBy('nombre')->get(['id','sku','nombre','precio','stock','stock_minimo','estado','categoria_id']);
        return response()->json(['componentes'=>$list]);
    }
}
