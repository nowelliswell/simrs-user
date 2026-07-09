<?php

namespace App\Http\Controllers;

use App\Models\UserToGroupUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnggotaControllerController extends Controller
{
    public function index(Request $request)
    {
        $query = UserToGroupUser::select([
            'pegawai.id as pegawai_id',
            'pegawai.nik',
            'pegawai.nama',
            'pegawai.jbtn',
            'user_to_group_users.id_group',
            'user_to_group_users.id',
            'user_to_group_users.is_leader'
        ])
            ->leftJoin('pegawai', 'pegawai.nik', '=', 'user_to_group_users.nik_pegawai')
            ->where('user_to_group_users.id_group', $request->idGroup); // Filter berdasarkan grup

        // Pencarian berdasarkan kolom 'nama' dan 'nik'
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

        // Ambil hasil pencarian
        $pegawai = $query->get();

        // Return hasil dalam format JSON
        return response()->json([
            'message' => 'Success',
            'data' => $pegawai
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nik_pegawai' => 'required|string|exists:pegawai,nik', // Pastikan NIK valid dan ada di tabel 'pegawai'
            'id_group' => 'required|string|exists:group_users,id', // Pastikan ID group valid dan ada di tabel 'group_users'
            'is_leader' => 'nullable|boolean', // Nilai opsional, default ke false jika tidak diberikan
        ]);

        // Cek apakah anggota sudah terdaftar di group MANAPUN
        // Aturan bisnis: 1 pegawai hanya boleh berada di 1 group saja
        $checkAnggota = UserToGroupUser::where('nik_pegawai', $validated['nik_pegawai'])
            ->first();

        if ($checkAnggota) {
            return response()->json([
                'success' => false,
                'message' => 'Anggota sudah terdaftar di group lain. Satu pegawai hanya boleh berada di 1 group.',
                'error' => "Anggota sudah terdaftar di group lain",
            ], 422);
        }

        try {
            // Simpan data ke dalam tabel
            $userToGroupUser = UserToGroupUser::create([
                'nik_pegawai' => $validated['nik_pegawai'],
                'id_group' => $validated['id_group'],
                'is_leader' => $validated['is_leader'] ?? false, // Default ke false jika tidak ada nilai
            ]);

            // Return respons sukses
            return response()->json([
                'success' => true,
                'message' => 'Data berhasil disimpan.',
                'data' => $userToGroupUser,
            ], 201);
        } catch (\Exception $e) {
            // Return respons jika terjadi error
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan data.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function hapusAnggota($id)
    {
        // Cari anggota berdasarkan nik_pegawai
        $checkAnggota = UserToGroupUser::where('id', $id)->first();

        // Jika anggota tidak ditemukan
        if (!$checkAnggota) {
            return response()->json([
                'message' => 'Data tidak ditemukan.',
                'error' => 'Anggota tidak ditemukan',
            ], 404);
        }

        // Hapus anggota
        $checkAnggota->delete();

        // Berikan respons berhasil
        return response()->json([
            'message' => 'Data berhasil dihapus.',
            'data' => 'Hapus data berhasil',
        ], 200);
    }

    public function setLeader(Request $request)
    {
        // Validasi input
        $request->validate([
            'id_group' => 'required|exists:user_to_group_users,id_group',
            'id' => 'required|exists:user_to_group_users,id',
        ]);

        DB::beginTransaction(); // Mulai transaksi database untuk memastikan konsistensi

        try {
            // Set semua anggota dalam grup ini menjadi is_leader = false
            UserToGroupUser::where('id_group', $request->id_group)
                ->update(['is_leader' => false]);

            // Set anggota tertentu menjadi is_leader = true
            $user = UserToGroupUser::where('id_group', $request->id_group)
                ->where('id', $request->id)
                ->first();

            if (!$user) {
                return response()->json([
                    'message' => 'Anggota tidak ditemukan dalam grup ini.',
                ], 404);
            }

            $user->update(['is_leader' => true]);

            DB::commit(); // Commit transaksi jika semua operasi berhasil

            return response()->json([
                'message' => 'Leader berhasil diubah.',
                'data' => $user,
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack(); // Rollback jika terjadi kesalahan

            return response()->json([
                'message' => 'Terjadi kesalahan saat mengubah leader.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
