<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_to_group_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nik_pegawai', 20);
            $table->uuid('id_group');
            $table->boolean('is_leader')->default(false);
            $table->timestamps();

            $table->foreign('nik_pegawai')->references('nik')->on('pegawai')->onDelete('cascade');
            $table->foreign('id_group')->references('id')->on('group_users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_to_group_users');
    }
};
