<?php
namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class ComponentesController extends Controller
{
    public function porCategoria()
    {
        $orden = [
            'ACCESORIOS / OTROS',
            'CPU','MOTHERBOARD','RAM','ALMACENAMIENTO',
            'GPU','PSU','GABINETE','COOLER','SO','PERIFERICOS',
        ];

        $rows = DB::table('productos as p')
            ->leftJoin('categorias as c', 'c.id', '=', 'p.categoria_id')
            ->where('p.tipo', 'COMPONENTE')
            ->where('p.stock', '>', 0)
            ->select(
                'p.id','p.sku','p.nombre','p.marca','p.modelo',
                'p.precio','p.stock',
                'c.nombre as categoria'
            )
            ->orderByRaw(
                "FIELD(UPPER(COALESCE(c.nombre,'ACCESORIOS / OTROS')),
                    'ACCESORIOS / OTROS',
                    'CPU','MOTHERBOARD','RAM','ALMACENAMIENTO',
                    'GPU','PSU','GABINETE','COOLER','SO','PERIFERICOS'
                )"
            )
            ->orderBy('p.nombre')
            ->get();

        $grouped = [];
        foreach ($rows as $it) {
            $cat = strtoupper($it->categoria ?? 'ACCESORIOS / OTROS');
            $key = in_array($cat, $orden, true) ? $cat : 'ACCESORIOS / OTROS';
            $grouped[$key][] = $it;
        }

        // Garantiza que todas existan aunque estén vacías
        foreach ($orden as $k) {
            if (!isset($grouped[$k])) $grouped[$k] = [];
        }

        return response()->json(['categorias' => $grouped]);
    }
}
