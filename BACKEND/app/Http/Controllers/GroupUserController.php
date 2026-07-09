<?php

namespace App\Http\Controllers;

use App\Models\GroupUser;
use App\Models\UserToGroupUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GroupUserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search'); // Search keyword
        $query = GroupUser::query();

        // Jika ada pencarian berdasarkan nama_group
        if ($search) {
            $query->where('nama_group', 'like', '%' . $search . '%');
        }

        // Mengambil data group dan jumlah anggota di setiap group
        $groups = $query->withCount('userToGroupUsers') // Menghitung jumlah anggota untuk setiap grup
            ->get();

        return response()->json([
            'success' => true,
            'data' => $groups
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama_group' => 'required|string|max:255'
        ]);

        $group = GroupUser::create([
            'nama_group' => $request->input('nama_group')
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Group created successfully',
            'data' => $group
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'nama_group' => 'required|string|max:255'
        ]);

        $group = GroupUser::find($id);

        if (!$group) {
            return response()->json([
                'success' => false,
                'message' => 'Group not found'
            ], 404);
        }

        $group->update([
            'nama_group' => $request->input('nama_group')
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Group updated successfully',
            'data' => $group
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $group = GroupUser::find($id);

        if (!$group) {
            return response()->json([
                'success' => false,
                'message' => 'Group not found'
            ], 404);
        }

        $group->delete();

        return response()->json([
            'success' => true,
            'message' => 'Group deleted successfully'
        ]);
    }

    public function copyUserBerdasarkanGroup($id)
    {
        DB::beginTransaction();

        try {
            set_time_limit(120); // Mencegah PHP execution timeout
            
            $leader = UserToGroupUser::where('id_group', $id)
                ->where('is_leader', true)
                ->first();

            if (!$leader) {
                return response()->json([
                    'success' => false,
                    'message' => 'Leader tidak ada dalam group ini'
                ], 404);
            }

            // ✅ FAST: Pakai id_user_plain
            $aksesLeader = DB::table('user')
                ->where('id_user_plain', $leader->nik_pegawai)
                ->first();

            // Check apakah leader punya akses
            if (!$aksesLeader || !isset($aksesLeader->id_user_plain) || !$aksesLeader->id_user_plain) {
                return response()->json([
                    'success' => false,
                    'message' => 'Leader belum punya akses user'
                ], 404);
            }

            // Ambil kolom akses saja — buang id_user, id_user_plain, dan password
            $aksesData = [];
            foreach ($aksesLeader as $key => $value) {
                if (!in_array($key, ['id_user', 'id_user_plain', 'password'])) {
                    $aksesData[$key] = $value;
                }
            }

            $anggota = UserToGroupUser::where('id_group', $id)
                ->where('is_leader', false)
                ->get();

            if ($anggota->isEmpty()) {
                DB::commit();
                return response()->json([
                    'success' => true,
                    'message' => 'Tidak ada anggota untuk disesuaikan.',
                    'summary' => ['updated' => 0, 'inserted' => 0, 'skipped' => 0]
                ]);
            }

            $niks = $anggota->pluck('nik_pegawai')->toArray();

            // [BULK SELECT 1] Cek anggota yang ada di grup lain sekaligus
            $anggotaDiGrupLain = UserToGroupUser::whereIn('nik_pegawai', $niks)
                ->where('id_group', '!=', $id)
                ->pluck('nik_pegawai')
                ->toArray();

            // [BULK SELECT 2] Cek user yang sudah punya akun sekaligus
            $userTerdaftar = DB::table('user')
                ->whereIn('id_user_plain', $niks)
                ->pluck('id_user_plain')
                ->toArray();

            $nikUntukUpdate = [];
            $dataUntukInsert = [];
            $res = [
                'updated'  => [],
                'inserted' => [],
                'skipped'  => [],
            ];

            foreach ($anggota as $item) {
                $nik = $item->nik_pegawai;

                // Jika terdaftar di grup lain, lewati (skipped)
                if (in_array($nik, $anggotaDiGrupLain)) {
                    $res['skipped'][] = [
                        'nik'    => $nik,
                        'reason' => 'Pegawai sudah terdaftar di group lain. Hapus dari group tersebut sebelum copy akses.',
                    ];
                    continue;
                }

                // Kelompokkan antara yang perlu UPDATE dan yang perlu INSERT
                if (in_array($nik, $userTerdaftar)) {
                    $nikUntukUpdate[] = $nik;
                    $res['updated'][] = $nik;
                } else {
                    $newData = $aksesData;
                    $newData['id_user'] = DB::raw("AES_ENCRYPT('{$nik}', 'nur')");
                    $newData['id_user_plain'] = $nik; // Sync!
                    $newData['password'] = DB::raw("AES_ENCRYPT('1234', 'windi')");
                    $dataUntukInsert[] = $newData;
                    $res['inserted'][] = $nik;
                }
            }

            // [BULK UPDATE] Eksekusi update untuk semua user yang sudah ada sekaligus (1 Kueri)
            if (!empty($nikUntukUpdate)) {
                DB::table('user')
                    ->whereIn('id_user_plain', $nikUntukUpdate)
                    ->update($aksesData);
            }

            // [BULK INSERT] Eksekusi insert untuk semua user baru sekaligus (1 Kueri)
            if (!empty($dataUntukInsert)) {
                DB::table('user')->insert($dataUntukInsert);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'data'    => $res,
                'summary' => [
                    'updated'  => count($res['updated']),
                    'inserted' => count($res['inserted']),
                    'skipped'  => count($res['skipped']),
                ],
            ], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error("Sesuaikan Akses Error: " . $th->getMessage(), ['trace' => $th->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat menyesuaikan akses.'
            ], 500);
        }
    }
}
