<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Menambahkan UNIQUE constraint pada kolom nik_pegawai di tabel
     * user_to_group_users, untuk memastikan bahwa 1 pegawai hanya
     * dapat terdaftar di 1 group saja (bukan 2 group atau lebih).
     *
     * Aturan bisnis:
     * - 1 user (nik_pegawai) = maksimal 1 group
     * - 1 user tidak boleh jadi leader di lebih dari 1 group
     *   (sudah otomatis tercegah dari constraint ini)
     */
    public function up(): void
    {
        // Cek terlebih dahulu apakah ada data duplikat yang akan melanggar constraint
        $duplicates = DB::select("
            SELECT nik_pegawai, COUNT(*) as cnt
            FROM user_to_group_users
            GROUP BY nik_pegawai
            HAVING cnt > 1
        ");

        if (!empty($duplicates)) {
            $nikList = implode(', ', array_column($duplicates, 'nik_pegawai'));
            throw new \RuntimeException(
                "Migration gagal: Ditemukan pegawai yang terdaftar di lebih dari 1 group.\n" .
                "Bersihkan data berikut terlebih dahulu: {$nikList}\n" .
                "Gunakan query: DELETE FROM user_to_group_users WHERE nik_pegawai IN ('{$nikList}') ORDER BY created_at DESC LIMIT <n>;"
            );
        }

        Schema::table('user_to_group_users', function (Blueprint $table) {
            // UNIQUE pada nik_pegawai saja:
            // Menjamin 1 pegawai hanya bisa masuk 1 group
            $table->unique('nik_pegawai', 'uq_nik_pegawai');
        });

        echo "\n✅ Migration completed successfully!\n";
        echo "   - Added unique constraint: uq_nik_pegawai\n";
        echo "   - Rule enforced: 1 pegawai = maksimal 1 group\n\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_to_group_users', function (Blueprint $table) {
            $table->dropUnique('uq_nik_pegawai');
        });

        echo "\n✅ Rollback completed successfully!\n";
        echo "   - Removed unique constraint: uq_nik_pegawai\n\n";
    }
};
