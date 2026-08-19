<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        try {
            // 1. KPI Metrik Utama (Pegawai & User)
            $totalPegawai = DB::table('pegawai')->count();
            
            // Hitung user aktif yang punya akun di tabel user
            $userAktif = DB::table('user')
                ->whereNotNull('id_user_plain')
                ->count();
                
            $userBelumAkses = max(0, $totalPegawai - $userAktif);
            $persentaseAkses = $totalPegawai > 0 ? round(($userAktif / $totalPegawai) * 100, 2) : 0;

            $totalGroup = DB::table('group_users')->count();
            
            // Pegawai yang sudah masuk ke group peran
            $pegawaiDalamGroup = DB::table('user_to_group_users')
                ->distinct('nik_pegawai')
                ->count('nik_pegawai');
                
            $pegawaiLuarGroup = max(0, $totalPegawai - $pegawaiDalamGroup);

            // 2. Data Grafik: Distribusi Anggota per Group
            $distribusiGroup = DB::table('group_users')
                ->leftJoin('user_to_group_users', 'group_users.id', '=', 'user_to_group_users.id_group')
                ->select([
                    'group_users.id',
                    'group_users.nama_group',
                    DB::raw('COUNT(user_to_group_users.id) as total_anggota'),
                    DB::raw('MAX(CASE WHEN user_to_group_users.is_leader = 1 THEN 1 ELSE 0 END) as has_leader')
                ])
                ->groupBy('group_users.id', 'group_users.nama_group')
                ->orderByDesc('total_anggota')
                ->get()
                ->map(function ($g) {
                    return [
                        'id' => (string) $g->id,
                        'nama_group' => $g->nama_group,
                        'total_anggota' => (int) $g->total_anggota,
                        'has_leader' => (bool) $g->has_leader,
                    ];
                });

            // 3. Data Grafik: Top 7 Jabatan Pegawai
            $topJabatan = DB::table('pegawai')
                ->select('jbtn as jabatan', DB::raw('COUNT(*) as total'))
                ->whereNotNull('jbtn')
                ->where('jbtn', '!=', '')
                ->groupBy('jbtn')
                ->orderByDesc('total')
                ->limit(7)
                ->get()
                ->map(function ($j) {
                    return [
                        'jabatan' => $j->jabatan,
                        'total' => (int) $j->total,
                    ];
                });

            // 4. Security Audit: Group yang Belum Memiliki Leader
            $groupTanpaLeader = DB::table('group_users')
                ->leftJoin('user_to_group_users', 'group_users.id', '=', 'user_to_group_users.id_group')
                ->select([
                    'group_users.id',
                    'group_users.nama_group',
                    DB::raw('COUNT(user_to_group_users.id) as total_anggota'),
                    DB::raw('MAX(CASE WHEN user_to_group_users.is_leader = 1 THEN 1 ELSE 0 END) as has_leader')
                ])
                ->groupBy('group_users.id', 'group_users.nama_group')
                ->havingRaw('has_leader = 0')
                ->get()
                ->map(function ($g) {
                    return [
                        'id' => (string) $g->id,
                        'nama_group' => $g->nama_group,
                        'total_anggota' => (int) $g->total_anggota,
                    ];
                });

            // 5. Security Audit: Pegawai Terbaru yang Belum Terdaftar di Group
            $pegawaiTanpaGroup = DB::table('pegawai')
                ->leftJoin('user_to_group_users', 'pegawai.nik', '=', 'user_to_group_users.nik_pegawai')
                ->leftJoin('user', 'user.id_user_plain', '=', 'pegawai.nik')
                ->whereNull('user_to_group_users.id')
                ->select([
                    'pegawai.nik',
                    'pegawai.nama',
                    'pegawai.jbtn',
                    DB::raw('CASE WHEN user.id_user_plain IS NOT NULL THEN 1 ELSE 0 END as has_user')
                ])
                ->orderBy('pegawai.id', 'desc')
                ->limit(5)
                ->get();

            // 6. Security Audit: Daftar Leader Aktif per Group
            $daftarLeader = DB::table('user_to_group_users')
                ->join('group_users', 'group_users.id', '=', 'user_to_group_users.id_group')
                ->join('pegawai', 'pegawai.nik', '=', 'user_to_group_users.nik_pegawai')
                ->where('user_to_group_users.is_leader', 1)
                ->select([
                    'group_users.id as group_id',
                    'group_users.nama_group',
                    'pegawai.nik as nik_leader',
                    'pegawai.nama as nama_leader',
                    'pegawai.jbtn as jabatan_leader'
                ])
                ->orderBy('group_users.nama_group')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Dashboard statistics fetched successfully',
                'data' => [
                    'kpi' => [
                        'total_pegawai'       => $totalPegawai,
                        'user_aktif'          => $userAktif,
                        'user_belum_akses'    => $userBelumAkses,
                        'persentase_akses'    => $persentaseAkses,
                        'total_group'         => $totalGroup,
                        'pegawai_dalam_group' => $pegawaiDalamGroup,
                        'pegawai_luar_group'  => $pegawaiLuarGroup,
                    ],
                    'charts' => [
                        'distribusi_group' => $distribusiGroup,
                        'top_jabatan'      => $topJabatan,
                        'status_akun'      => [
                            ['label' => 'Punya Akses User', 'value' => $userAktif, 'color' => '#10B981'],
                            ['label' => 'Belum Punya Akses', 'value' => $userBelumAkses, 'color' => '#F59E0B'],
                        ],
                    ],
                    'security_audit' => [
                        'group_tanpa_leader'          => $groupTanpaLeader,
                        'pegawai_terbaru_tanpa_group' => $pegawaiTanpaGroup,
                        'daftar_leader_aktif'         => $daftarLeader,
                    ],
                ]
            ]);
        } catch (\Throwable $th) {
            Log::error('Dashboard Stats Error: ' . $th->getMessage(), ['trace' => $th->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data statistik dashboard.',
                'error'   => $th->getMessage(),
            ], 500);
        }
    }
}
