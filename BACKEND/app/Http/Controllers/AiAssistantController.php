<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiAssistantController extends Controller
{
    public function chat(Request $request)
    {
        set_time_limit(120);
        $request->validate(['message' => 'required|string|max:2000']);

        try {
            // Ambil daftar kolom akses dari tabel user (untuk konteks AI)
            $userColumns = DB::getSchemaBuilder()->getColumnListing('user');
            $aksesColumns = array_diff($userColumns, ['id_user', 'id_user_plain', 'password']);

            // Ambil daftar group yang ada
            $groups = DB::table('group_users')->select('id', 'nama_group')->get();

            // Bangun system prompt
            $systemPrompt = <<<PROMPT
Kamu adalah asisten admin SIMRS (Sistem Informasi Manajemen Rumah Sakit) bernama "SIMRS AI Assistant".
Kamu membantu admin mengelola hak akses user, pegawai, dan group user.

KONTEKS SISTEM:
- Tabel pegawai: id, nik, nama, jbtn (jabatan)
- Tabel user: id_user (encrypted), id_user_plain (NIK), password (encrypted), + kolom-kolom akses boolean
- Kolom akses yang tersedia: {$this->formatColumns($aksesColumns)}
- Group yang ada: {$groups->map(fn($g) => "$g->nama_group (ID: $g->id)")->implode(', ')}

KEMAMPUAN SISTEM:
- Cari pegawai berdasarkan nama atau NIK
- Lihat detail akses user
- Toggle akses user (true/false)
- Copy akses antar user
- CRUD group user
- Tambah/hapus anggota group
- Set leader group
- Copy akses leader ke semua anggota group

ATURAN:
1. Jawab dalam Bahasa Indonesia yang ramah dan ringkas.
2. Jika user bertanya tentang data, LAKUKAN QUERY dan tampilkan hasilnya.
3. Jika user meminta aksi (ubah akses, copy, buat group, dll), jelaskan apa yang akan dilakukan dan LAKUKAN langsung.
4. Untuk aksi berbahaya (hapus data), minta konfirmasi dulu.
5. Format data dalam tabel jika memungkinkan.
6. Jika pertanyaan di luar konteks SIMRS, jawab sopan bahwa kamu hanya bisa membantu urusan SIMRS.
PROMPT;

            // Proses perintah user — cek apakah bisa di-handle langsung
            $directResult = $this->tryDirectAction($request->message);

            if ($directResult) {
                $systemPrompt .= "\n\nHASIL QUERY DATABASE:\n" . json_encode($directResult, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                $systemPrompt .= "\n\nGunakan data di atas untuk menjawab pertanyaan user. Format dengan rapi.";
            }

            // Kirim ke Gemini (gemini-3.5-flash-lite: respons super cepat ~1 detik)
            $apiKey = env('GEMINI_API_KEY');
            $response = Http::withoutVerifying()->timeout(20)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={$apiKey}",
                [
                    'contents' => [
                        ['role' => 'user', 'parts' => [['text' => $systemPrompt . "\n\nPERTANYAAN USER: " . $request->message]]]
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'maxOutputTokens' => 2048,
                    ]
                ]
            );

            if (!$response->successful()) {
                Log::error('Gemini API Error', ['status' => $response->status(), 'body' => $response->body()]);
                return response()->json(['message' => 'Gagal menghubungi AI. Coba lagi nanti.'], 500);
            }

            $body = $response->json();
            $parts = $body['candidates'][0]['content']['parts'] ?? [];
            $aiText = '';
            foreach ($parts as $part) {
                if (isset($part['text'])) {
                    $aiText .= $part['text'];
                }
            }
            if (empty($aiText)) {
                $aiText = 'Maaf, saya tidak bisa memproses permintaan tersebut.';
            }

            return response()->json([
                'message' => $aiText,
                'hasData' => $directResult !== null,
            ]);

        } catch (\Throwable $th) {
            Log::error('AI Assistant Error: ' . $th->getMessage());
            return response()->json(['message' => 'Terjadi kesalahan sistem.'], 500);
        }
    }

    /**
     * Deteksi perintah sederhana dan query DB langsung — agar AI punya data nyata untuk dijawab.
     */
    private function tryDirectAction(string $message): ?array
    {
        $msg = strtolower(trim($message));

        // Cari pegawai
        if (preg_match('/(?:cari|search|tampilkan|lihat|siapa)\s+(?:pegawai|karyawan|user|staff)?\s*(?:bernama|nama|dengan nama)?\s+(.+)/i', $message, $m)) {
            $keyword = trim($m[1], ' "\'?.');
            $results = DB::table('pegawai')
                ->select('nik', 'nama', 'jbtn')
                ->where('nama', 'like', "%{$keyword}%")
                ->limit(20)
                ->get();
            return ['type' => 'search_pegawai', 'keyword' => $keyword, 'count' => $results->count(), 'data' => $results];
        }

        // Detail akses user by NIK
        if (preg_match('/(?:detail|akses|hak akses|lihat akses)\s+(?:user|pegawai)?\s*(\d{5,})/i', $message, $m)) {
            $nik = $m[1];
            $user = DB::table('user')->where('id_user_plain', $nik)->first();
            $pegawai = DB::table('pegawai')->where('nik', $nik)->first();
            if ($user && $pegawai) {
                $aksesData = [];
                foreach ($user as $key => $value) {
                    if (!in_array($key, ['id_user', 'id_user_plain', 'password'])) {
                        $aksesData[$key] = $value;
                    }
                }
                return ['type' => 'detail_akses', 'nik' => $nik, 'nama' => $pegawai->nama, 'akses' => $aksesData];
            }
        }

        // List anggota group
        if (preg_match('/(?:anggota|member|daftar|list)\s+(?:grup|group|kelompok)\s+(.+)/i', $message, $m)) {
            $groupName = trim($m[1], ' "\'?.');
            $group = DB::table('group_users')->where('nama_group', 'like', "%{$groupName}%")->first();
            if ($group) {
                $anggota = DB::table('user_to_group_users')
                    ->leftJoin('pegawai', 'pegawai.nik', '=', 'user_to_group_users.nik_pegawai')
                    ->where('user_to_group_users.id_group', $group->id)
                    ->select('pegawai.nik', 'pegawai.nama', 'pegawai.jbtn', 'user_to_group_users.is_leader')
                    ->get();
                return ['type' => 'anggota_group', 'group' => $group->nama_group, 'count' => $anggota->count(), 'data' => $anggota];
            }
        }

        // List semua group
        if (preg_match('/(?:daftar|list|semua|tampilkan)\s+(?:grup|group)/i', $message)) {
            $groups = DB::table('group_users')
                ->leftJoin('user_to_group_users', 'group_users.id', '=', 'user_to_group_users.id_group')
                ->select('group_users.id', 'group_users.nama_group', DB::raw('COUNT(user_to_group_users.id) as jumlah_anggota'))
                ->groupBy('group_users.id', 'group_users.nama_group')
                ->get();
            return ['type' => 'list_group', 'count' => $groups->count(), 'data' => $groups];
        }

        // Hitung total pegawai
        if (preg_match('/(?:berapa|total|jumlah)\s+(?:pegawai|karyawan|user|staff)/i', $message)) {
            $total = DB::table('pegawai')->count();
            $withAccess = DB::table('pegawai')
                ->leftJoin('user', 'user.id_user_plain', '=', 'pegawai.nik')
                ->whereNotNull('user.id_user_plain')
                ->count();
            return ['type' => 'statistik', 'total_pegawai' => $total, 'punya_akses' => $withAccess, 'belum_akses' => $total - $withAccess];
        }

        return null;
    }

    private function formatColumns(array $columns): string
    {
        return implode(', ', array_values($columns));
    }
}
