<?php

use App\Http\Controllers\AnggotaControllerController;
use App\Http\Controllers\GroupUserController;
use App\Http\Controllers\PegawaiController;
use App\Models\GroupUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });

Route::get("/pegawai", [PegawaiController::class, 'index']);
Route::get("/detail-user/{id}", [PegawaiController::class, 'detailUser']);
Route::post("/ganti-akses-user/{id}", [PegawaiController::class, 'editSatuUser']);
Route::post("/edit-username-password/{nik}", [PegawaiController::class, 'editUsernamePassword']);
Route::delete("/delete-user/{nik}", [PegawaiController::class, 'deleteUser']);

Route::get("/group-user", [GroupUserController::class, 'index']);
Route::post("/group-user", [GroupUserController::class, 'store']);
Route::put("/group-user/{id}", [GroupUserController::class, 'update']);
Route::delete("/group-user/{id}", [GroupUserController::class, 'destroy']);

Route::get("/anggota-group-user", [AnggotaControllerController::class, 'index']);
Route::post("/anggota-group-user", [AnggotaControllerController::class, 'store']);
Route::delete("/anggota-group-user/{id}", [AnggotaControllerController::class, 'hapusAnggota']);
Route::post("/set-leader", [AnggotaControllerController::class, 'setLeader']);

Route::post("/copy-akses", [PegawaiController::class, 'copyAkses']);

Route::get("/copy-user-group/{id}", [GroupUserController::class, 'copyUserBerdasarkanGroup']);
