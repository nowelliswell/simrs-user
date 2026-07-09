<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class DatabaseModeMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Ambil mode dari header X-Database-Mode
        $mode = $request->header('X-Database-Mode', 'development');
        
        // Validasi mode
        if (!in_array($mode, ['production', 'development'])) {
            $mode = 'development';
        }
        
        // Set database berdasarkan mode
        $database = $mode === 'production' ? 'simrs_rsud' : 'simrs_rsud2';
        
        // Update config dan reconnect
        Config::set('database.connections.mysql.database', $database);
        DB::purge('mysql');
        DB::reconnect('mysql');

        return $next($request);
    }
}
