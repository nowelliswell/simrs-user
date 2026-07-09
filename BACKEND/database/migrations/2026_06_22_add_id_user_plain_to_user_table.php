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
     * Menambah kolom id_user_plain untuk optimasi performa query.
     * Kolom ini adalah versi plain text dari id_user (yang terenkripsi)
     * untuk memungkinkan penggunaan INDEX pada JOIN dan WHERE clause.
     */
    public function up(): void
    {
        Schema::table('user', function (Blueprint $table) {
            // Tambah kolom id_user_plain setelah kolom id_user
            $table->string('id_user_plain', 255)->nullable()->after('id_user');
            
            // Tambah UNIQUE INDEX untuk performa query
            $table->unique('id_user_plain', 'idx_id_user_plain');
        });

        // Populate kolom id_user_plain dari data id_user yang sudah ada
        // Decrypt semua id_user dan simpan ke id_user_plain
        DB::statement("
            UPDATE user 
            SET id_user_plain = AES_DECRYPT(id_user, 'nur')
            WHERE id_user IS NOT NULL
        ");
        
        echo "\n✅ Migration completed successfully!\n";
        echo "   - Added column: id_user_plain\n";
        echo "   - Added unique index: idx_id_user_plain\n";
        
        $count = DB::table('user')->whereNotNull('id_user_plain')->count();
        echo "   - Populated {$count} existing users\n\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user', function (Blueprint $table) {
            $table->dropUnique('idx_id_user_plain');
            $table->dropColumn('id_user_plain');
        });
        
        echo "\n✅ Rollback completed successfully!\n";
        echo "   - Removed column: id_user_plain\n";
        echo "   - Removed index: idx_id_user_plain\n\n";
    }
};
