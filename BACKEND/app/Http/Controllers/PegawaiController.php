<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PegawaiController extends Controller
{
    public function index(Request $request)
    {
        // ✅ FAST: Pakai id_user_plain dengan index
        $query = DB::table('pegawai')
            ->select([
                'pegawai.id',
                'pegawai.nik',
                'pegawai.nama',
                'pegawai.jbtn',
                DB::raw("CASE WHEN user.id_user_plain IS NOT NULL THEN 1 ELSE 0 END AS has_user"),
            ])
            ->leftJoin('user', 'user.id_user_plain', '=', 'pegawai.nik');

        if ($request->has('search') && $request->search != '') {
            $search = trim($request->search);
            $query->where(function ($query) use ($search) {
                if (is_numeric($search)) {
                    // NIK: Prefix search (sargable, uses index)
                    $query->where('pegawai.nik', 'like', $search . '%');
                } else {
                    // Nama: FULLTEXT search jika >= 3 karakter, fallback ke LIKE jika < 3 karakter
                    if (strlen($search) >= 3) {
                        $query->whereRaw("MATCH(pegawai.nama) AGAINST(? IN BOOLEAN MODE)", [$search . '*']);
                    } else {
                        $query->where('pegawai.nama', 'like', '%' . $search . '%');
                    }
                }
            });
        }

        // Pagination: ambil per_page dari request atau default 50
        $perPage = $request->get('per_page', 50);
        $pegawai = $query->paginate($perPage);

        return response()->json([
            'message' => 'Success',
            'data' => $pegawai->items(),
            'pagination' => [
                'current_page' => $pegawai->currentPage(),
                'total' => $pegawai->total(),
                'per_page' => $pegawai->perPage(),
                'last_page' => $pegawai->lastPage(),
            ]
        ]);
    }

    public function detailUser($id)
    {
        // ✅ FAST: Pakai id_user_plain
        $selectedUser = DB::selectOne("
            SELECT user.*,
                   user.id_user_plain AS id_user,
                   AES_DECRYPT(user.password, 'windi') AS password,
                   pegawai.nama
            FROM pegawai
            LEFT JOIN user ON user.id_user_plain = pegawai.nik
            WHERE pegawai.nik = ?
            LIMIT 1
        ", [$id]);

        return response()->json([
            'message' => 'Success',
            'data' => $selectedUser
        ]);
    }

    public function editUsernamePassword(Request $request, $nik)
    {
        $request->validate([
            'id_user_baru'   => 'required|string|max:255',
            'password_baru'  => 'required|string|max:255',
        ]);

        DB::beginTransaction();

        try {
            // ✅ FAST: Pakai id_user_plain
            $existingUser = DB::table('user')
                ->where('id_user_plain', $nik)
                ->first();
            
            if (!$existingUser) {
                return response()->json([
                    'message' => 'User tidak ditemukan untuk NIK tersebut.',
                ], 404);
            }
            
            // Update dengan sync id_user_plain juga
            $affected = DB::table('user')
                ->where('id_user_plain', $nik)
                ->update([
                    'id_user'       => DB::raw("AES_ENCRYPT('{$request->id_user_baru}', 'nur')"),
                    'id_user_plain' => $request->id_user_baru, // Sync!
                    'password'      => DB::raw("AES_ENCRYPT('{$request->password_baru}', 'windi')"),
                ]);

            DB::commit();

            return response()->json([
                'message' => 'Username dan password berhasil diperbarui.',
                'data'    => $affected,
            ]);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json([
                'message' => 'Terjadi kesalahan.',
                'error'   => $th->getMessage(),
            ], 500);
        }
    }

    public function copyAkses(Request $request)
    {
        DB::beginTransaction();

        try {
            // ✅ FAST: Pakai id_user_plain
            $selectedUser = DB::table('user')
                ->where('id_user_plain', $request->userParent)
                ->first();

            if (!$selectedUser) {
                DB::rollback();
                return response()->json(['message' => 'User sumber tidak ditemukan atau belum punya akses.'], 404);
            }

            // Ambil kolom akses (kecuali id_user, id_user_plain, dan password)
            $updateData = [];
            foreach ($selectedUser as $key => $value) {
                if (!in_array($key, ['id_user', 'id_user_plain', 'password'])) {
                    $updateData[$key] = $value;
                }
            }

            if (empty($updateData)) {
                DB::rollback();
                return response()->json(['message' => 'Tidak ada data akses yang bisa dicopy.'], 422);
            }

            // Cari user tujuan
            $targetUser = DB::table('user')
                ->where('id_user_plain', $request->userChild)
                ->first();

            if ($targetUser && ($targetUser->id_user_plain ?? null)) {
                // User tujuan sudah ada → UPDATE
                DB::table('user')
                    ->where('id_user_plain', $request->userChild)
                    ->update($updateData);
            } else {
                // User tujuan belum ada → INSERT dengan id_user = NIK tujuan
                $updateData['id_user'] = DB::raw("AES_ENCRYPT('{$request->userChild}', 'nur')");
                $updateData['id_user_plain'] = $request->userChild; // Sync!
                $updateData['password'] = DB::raw("AES_ENCRYPT('1234', 'windi')");
                DB::table('user')->insert($updateData);
            }

            DB::commit();
            return response()->json(['message' => 'Success']);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Terjadi kesalahan.', 'error' => $e->getMessage()], 500);
        }
    }

    public function editSatuUser(Request $request, $idUser)
    {
        // Whitelist kolom yang boleh diubah melalui endpoint ini
        // Mencegah SQL injection / manipulasi kolom sensitif
        $allowedColumns = [
            'id_user', 'id_user_plain', 'password',
            // kolom-kolom akses (tambahkan sesuai kebutuhan)
        ];

        // Ambil semua kolom dari tabel user, lalu filter agar kolom sensitif tidak bisa diubah
        $allColumns     = DB::getSchemaBuilder()->getColumnListing('user');
        $sensitifColumns = ['id_user', 'id_user_plain', 'password', 'created_at', 'updated_at'];
        $allowedColumns  = array_diff($allColumns, $sensitifColumns);

        if (!in_array($request['namaKolom'], $allowedColumns)) {
            return response()->json([
                'message' => 'Kolom tidak diizinkan untuk diubah.',
                'error'   => "Kolom '{$request['namaKolom']}' tidak ada dalam daftar kolom yang diizinkan.",
            ], 422);
        }

        try {
            // Toggle nilai: 'true' -> 'false', selain itu -> 'true'
            $nilaBaru = ($request['valueKolom'] == 'true') ? 'false' : 'true';

            // ✅ FAST: Pakai id_user_plain dengan index
            $affected = DB::table('user')
                ->where('id_user_plain', '=', $idUser)
                ->update([$request['namaKolom'] => $nilaBaru]);

            if ($affected) {
                return response()->json([
                    'message' => 'Success',
                    'data'    => $affected,
                ]);
            }

            return response()->json([
                'message' => 'User tidak ditemukan atau tidak ada perubahan.',
            ], 404);
        } catch (\Throwable $th) {
            return response()->json([
                'message' => 'Error',
                'data'    => $th->getMessage()
            ], 500);
        }
    }

    public function deleteUser($user)
    {
        // ✅ FAST: Pakai id_user_plain
        $deleted = DB::table('user')->where('id_user_plain', $user)->delete();

        if ($deleted) {
            return response()->json(['message' => 'Success']);
        }

        return response()->json(['message' => 'User tidak ditemukan.'], 404);
    }

    public function deletePegawai($nik)
    {
        DB::beginTransaction();
        try {
            // 1. Hapus akses user (jika ada)
            DB::table('user')
                ->whereRaw("AES_DECRYPT(id_user, 'nur') = ?", [$nik])
                ->delete();

            // 2. Hapus keanggotaan group (foreign key ke pegawai.nik)
            DB::table('user_to_group_users')
                ->where('nik_pegawai', $nik)
                ->delete();

            // 3. Hapus data pegawai
            $deleted = DB::table('pegawai')->where('nik', $nik)->delete();

            if (!$deleted) {
                DB::rollBack();
                return response()->json(['message' => 'Pegawai tidak ditemukan.'], 404);
            }

            DB::commit();
            return response()->json(['message' => 'Data pegawai berhasil dihapus.']);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json(['message' => 'Terjadi kesalahan.', 'error' => $th->getMessage()], 500);
        }
    }

    public function defaultPassword($user)
    {

        $selectedUser = DB::selectOne("
        SELECT id_user
        FROM user
        WHERE id_user = AES_ENCRYPT(?, 'nur') 
        LIMIT 1", [$user]);

        $tes = DB::update("
            UPDATE user 
            SET password = AES_ENCRYPT('1234', 'windi') 
            WHERE id_user = ?
        ", [$selectedUser->id_user]);

        if ($tes) {
            return response()->json([
                'message' => 'Success'
            ]);
        } else {
            return response()->json([
                'message' => 'Failed'
            ]);
        }
    }

    public function copyBuatBanyak(Request $request)
    {
        DB::beginTransaction();

        try {
            $selectedUser = DB::selectOne(
                "SELECT *
                    FROM user
                    WHERE id_user = AES_ENCRYPT(?, 'nur') 
                    LIMIT 1",
                [$request->userUtama]
            );

            if (empty($selectedUser)) {
                DB::rollback();
                return response()->json([
                    'message' => 'Failed',
                    'data' => 'User Parent Tidak Ditemukan'
                ]);
            } else {
                $properti = [];
                foreach ($selectedUser as $key => $value) {
                    $properti[$key] = $value;
                }

                $res = array();

                foreach ($request['userMasuk'] as $item) {
                    $checkUser = DB::selectOne(
                        "SELECT 
                        AES_DECRYPT(user.id_user, 'nur') AS id_user, 
                        AES_DECRYPT(user.password, 'windi') AS password
                            FROM user
                            WHERE id_user = AES_ENCRYPT(?, 'nur') 
                            LIMIT 1",
                        [$item]
                    );

                    if ($checkUser) {
                        $properti['id_user'] =  DB::raw("AES_ENCRYPT('$checkUser->id_user', 'nur')");
                        $properti['password'] = DB::raw("AES_ENCRYPT('$checkUser->password', 'windi')");

                        DB::table('user')
                            ->whereRaw("id_user = AES_ENCRYPT(?, 'nur')", [$item])
                            ->update($properti);

                        $res[] = "berhasil update, $checkUser->id_user";
                    } else {
                        $properti['id_user'] = DB::raw("AES_ENCRYPT('$item', 'nur')");
                        $properti['password'] = DB::raw("AES_ENCRYPT('1234', 'windi')");

                        DB::table('user')->insert($properti);
                        $res[] = "berhasil tambah baru, $item";
                    }
                }

                DB::commit();
                return response()->json(["data" => $res], 200);
            }
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json(["error" => $th->getMessage()], 400);
        }
    }
}
