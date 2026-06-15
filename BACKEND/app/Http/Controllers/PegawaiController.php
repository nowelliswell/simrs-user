<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PegawaiController extends Controller
{
    public function index(Request $request)
    {
        // Join ke tabel user untuk cek apakah pegawai sudah punya akses
        $query = DB::table('pegawai')
            ->select([
                'pegawai.id',
                'pegawai.nik',
                'pegawai.nama',
                'pegawai.jbtn',
                DB::raw("CASE WHEN user.id_user IS NOT NULL THEN 1 ELSE 0 END AS has_user"),
            ])
            ->leftJoin('user', DB::raw("AES_DECRYPT(user.id_user, 'nur')"), '=', 'pegawai.nik');

        if ($request->has('search') && $request->search != '') {
            $query->where(function ($query) use ($request) {
                $query->where('pegawai.nama', 'like', '%' . $request->search . '%')
                    ->orWhere('pegawai.nik', 'like', '%' . $request->search . '%');
            });
        }

        $pegawai = $query->get();

        return response()->json([
            'message' => 'Success',
            'data' => $pegawai
        ]);
    }

    public function detailUser($id)
    {
        // Fetch user by NIK (join pegawai → user), sehingga tetap bekerja
        // meskipun id_user sudah diubah dari nilai NIK semula
        $selectedUser = DB::selectOne("
        SELECT user.*,
               AES_DECRYPT(user.id_user, 'nur') AS id_user, 
               AES_DECRYPT(user.password, 'windi') AS password, 
               pegawai.nama
        FROM pegawai
        LEFT JOIN user ON AES_DECRYPT(user.id_user, 'nur') = pegawai.nik
            OR user.id_user = AES_ENCRYPT(pegawai.nik, 'nur')
        WHERE pegawai.nik = ?
        LIMIT 1", [$id]);

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
            // Cari user via NIK di tabel pegawai (identifier yang tidak pernah berubah)
            // Kondisi OR menangani dua kemungkinan:
            // 1. id_user masih sama dengan NIK (belum pernah diubah)
            // 2. id_user sudah pernah diubah ke nilai lain
            $existingUser = DB::selectOne("
                SELECT user.id_user
                FROM pegawai
                LEFT JOIN user ON AES_DECRYPT(user.id_user, 'nur') = pegawai.nik
                WHERE pegawai.nik = ?
                LIMIT 1
            ", [$nik]);

            if (!$existingUser) {
                return response()->json([
                    'message' => 'User tidak ditemukan untuk NIK tersebut.',
                ], 404);
            }

            $affected = DB::table('user')
                ->where('id_user', $existingUser->id_user)
                ->update([
                    'id_user'  => DB::raw("AES_ENCRYPT('{$request->id_user_baru}', 'nur')"),
                    'password' => DB::raw("AES_ENCRYPT('{$request->password_baru}', 'windi')"),
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
            // Cari akses user sumber via join pegawai
            $selectedUser = DB::selectOne("
                SELECT user.*
                FROM pegawai
                LEFT JOIN user ON AES_DECRYPT(user.id_user, 'nur') = pegawai.nik
                WHERE pegawai.nik = ?
                LIMIT 1
            ", [$request->userParent]);

            if (!$selectedUser) {
                DB::rollback();
                return response()->json(['message' => 'User sumber tidak ditemukan atau belum punya akses.'], 404);
            }

            // Ambil kolom akses (kecuali id_user dan password)
            $updateData = [];
            foreach ($selectedUser as $key => $value) {
                if ($key != 'id_user' && $key != 'password') {
                    $updateData[$key] = $value;
                }
            }

            if (empty($updateData)) {
                DB::rollback();
                return response()->json(['message' => 'Tidak ada data akses yang bisa dicopy.'], 422);
            }

            // Cari user tujuan
            $targetUser = DB::selectOne("
                SELECT user.id_user
                FROM pegawai
                LEFT JOIN user ON AES_DECRYPT(user.id_user, 'nur') = pegawai.nik
                WHERE pegawai.nik = ?
                LIMIT 1
            ", [$request->userChild]);

            if ($targetUser && $targetUser->id_user) {
                // User tujuan sudah ada → UPDATE
                DB::table('user')
                    ->where('id_user', $targetUser->id_user)
                    ->update($updateData);
            } else {
                // User tujuan belum ada → INSERT dengan id_user = NIK tujuan
                $updateData['id_user'] = DB::raw("AES_ENCRYPT('{$request->userChild}', 'nur')");
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
        try {

            if ($request['valueKolom'] == 'true') {
                $request['valueKolom'] = 'false';
            } else {
                $request['valueKolom'] = 'true';
            }

            $tes = DB::table('user')
                ->where('id_user', '=', DB::raw("AES_ENCRYPT('$idUser', 'nur')"))
                ->update([$request['namaKolom'] => $request['valueKolom']]);

            if ($tes) {
                return response()->json([
                    'message' => 'Success',
                    'data' => $tes
                ]);
            }
        } catch (\Throwable $th) {
            return response()->json([
                'message' => 'Success',
                'data' => $th->getMessage()
            ], 500);
        }
    }

    public function deleteUser($user)
    {
        $tes = DB::table('user')->whereRaw("id_user = AES_ENCRYPT(?, 'nur')", [$user])->delete();

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
