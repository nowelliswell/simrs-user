<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PegawaiController extends Controller
{
    public function index(Request $request)
    {
        // Mulai query untuk tabel 'pegawai'
        $query = DB::table('pegawai')->select(['id', 'nik', 'nama', 'jbtn']);

        // Pencarian berdasarkan kolom 'nama'
        if ($request->has('search') && $request->search != '') {
            $query->where(function ($query) use ($request) {
                $query->where('nama', 'like', '%' . $request->search . '%')
                    ->orWhere('nik', 'like', '%' . $request->search . '%');
            });
        }

        // Ambil hasil pencarian
        $pegawai = $query->get();

        // Return hasil dalam format JSON
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
            $selectedUser = DB::selectOne("
                SELECT *
                FROM user
                WHERE id_user = AES_ENCRYPT(?, 'nur') 
                LIMIT 1
            ", [$request->userParent]);

            if ($selectedUser) {
                $updateData = [];
                foreach ($selectedUser as $key => $value) {
                    if ($key != 'id_user' && $key != 'password') {
                        $updateData[$key] = $value;
                    }
                }

                $tes = DB::table('user')
                    ->whereRaw("id_user = AES_ENCRYPT(?, 'nur')", [$request->userChild])
                    ->update($updateData);
            } else {
                DB::rollback();
                return redirect()->back()->withInput()->withErrors(['error' => 'Id User Akun Tidak Ditemukan']);
            }

            DB::commit();
            if ($tes) {
                return response()->json([
                    'message' => 'Success'
                ]);
            } else {
                return response()->json([
                    'message' => 'Failed'
                ]);
            }
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withInput()->withErrors(['error' => 'SALAH']);
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
