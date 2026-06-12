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
                    'message' => 'leader tidak ada'
                ], 404);
            }

            $aksesLeader = DB::selectOne(
                "SELECT *
                FROM user
                WHERE id_user = AES_ENCRYPT(?, 'nur') 
                LIMIT 1",
                [$leader->nik_pegawai]
            );

            if (!$aksesLeader) {
                return response()->json([
                    'success' => false,
                    'message' => 'leader tidak user'
                ], 404);
            }

            $properti = [];
            foreach ($aksesLeader as $key => $value) {
                $properti[$key] = $value;
            }

            $res = array();

            $anggota = UserToGroupUser::where('id_group', $id)
                ->where('is_leader', false)
                ->get();

            foreach ($anggota as $item) {
                $checkUser = DB::selectOne(
                    "SELECT 
                AES_DECRYPT(user.id_user, 'nur') AS id_user, 
                AES_DECRYPT(user.password, 'windi') AS password
                    FROM user
                    WHERE id_user = AES_ENCRYPT(?, 'nur') 
                    LIMIT 1",
                    [$item->nik_pegawai]
                );

                if ($checkUser) {
                    $properti['id_user'] =  DB::raw("AES_ENCRYPT('$checkUser->id_user', 'nur')");
                    $properti['password'] = DB::raw("AES_ENCRYPT('$checkUser->password', 'windi')");

                    DB::table('user')
                        ->whereRaw("id_user = AES_ENCRYPT(?, 'nur')", [$item->nik_pegawai])
                        ->update($properti);

                    $res[] = "berhasil update, $checkUser->id_user";
                } else {
                    $properti['id_user'] = DB::raw("AES_ENCRYPT('$item->nik_pegawai', 'nur')");
                    $properti['password'] = DB::raw("AES_ENCRYPT('1234', 'windi')");

                    DB::table('user')->insert($properti);
                    $res[] = "berhasil tambah baru, $item";
                }
            }

            DB::commit();
            return response()->json(["data" => $res], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json(["error" => $th->getMessage()], 400);
        }
    }
}
