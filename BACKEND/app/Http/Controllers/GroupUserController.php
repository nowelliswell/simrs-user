<?php

namespace App\Http\Controllers;

use App\Models\GroupUser;
use App\Models\UserToGroupUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
            $leader = UserToGroupUser::where('id_group', $id)
                ->where('is_leader', true)
                ->first();

            if (!$leader) {
                return response()->json([
                    'success' => false,
                    'message' => 'Leader tidak ada dalam group ini'
                ], 404);
            }

            // Cari akses leader via join pegawai (tahan perubahan username)
            $aksesLeader = DB::selectOne(
                "SELECT user.*
                FROM pegawai
                LEFT JOIN user ON AES_DECRYPT(user.id_user, 'nur') = pegawai.nik
                WHERE pegawai.nik = ?
                LIMIT 1",
                [$leader->nik_pegawai]
            );

            if (!$aksesLeader || !$aksesLeader->id_user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Leader belum punya akses user'
                ], 404);
            }

            // Ambil kolom akses saja — buang id_user dan password (raw binary dari leader)
            $aksesData = [];
            foreach ($aksesLeader as $key => $value) {
                if ($key !== 'id_user' && $key !== 'password') {
                    $aksesData[$key] = $value;
                }
            }

            $res = [];

            $anggota = UserToGroupUser::where('id_group', $id)
                ->where('is_leader', false)
                ->get();

            foreach ($anggota as $item) {
                // Cari user anggota via join pegawai (tahan perubahan username)
                $checkUser = DB::selectOne(
                    "SELECT user.id_user,
                            AES_DECRYPT(user.id_user, 'nur') AS username,
                            AES_DECRYPT(user.password, 'windi') AS pwd
                     FROM pegawai
                     LEFT JOIN user ON AES_DECRYPT(user.id_user, 'nur') = pegawai.nik
                     WHERE pegawai.nik = ?
                     LIMIT 1",
                    [$item->nik_pegawai]
                );

                if ($checkUser && $checkUser->id_user) {
                    // Anggota sudah punya user → UPDATE akses saja, pertahankan id_user & password
                    DB::table('user')
                        ->where('id_user', $checkUser->id_user)
                        ->update($aksesData);

                    $res[] = "berhasil update: {$checkUser->username}";
                } else {
                    // Anggota belum punya user → INSERT dengan NIK sebagai username, password default 1234
                    $newData = $aksesData;
                    $newData['id_user'] = DB::raw("AES_ENCRYPT('{$item->nik_pegawai}', 'nur')");
                    $newData['password'] = DB::raw("AES_ENCRYPT('1234', 'windi')");

                    DB::table('user')->insert($newData);
                    $res[] = "berhasil tambah baru: {$item->nik_pegawai}";
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'data' => $res], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => $th->getMessage()], 400);
        }
    }
}
