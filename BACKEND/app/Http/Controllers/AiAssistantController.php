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

ATURAN KETAT:
1. Jawab dalam Bahasa Indonesia yang ramah, profesional, dan ringkas.
2. DILARANG KERAS MENGARANG DATA CONTOH atau menulis placeholder seperti "Menunggu data query database", "Contoh: Budi Santoso", dsb.
3. Jika data tersedia di HASIL QUERY DATABASE di bawah, SAJIKAN SELURUH DATA TERSEBUT DALAM TABEL MARKDOWN YANG LENGKAP DAN JELAS.
4. Jika data tidak ada di HASIL QUERY DATABASE, katakan secara jujur dan terus terang bahwa data tidak ditemukan di database SIMRS (jangan mengarang data fiktif).
5. Jika pertanyaan di luar konteks SIMRS, jawab sopan bahwa kamu hanya asisten sistem SIMRS.
PROMPT;

            // Proses perintah user — cek apakah bisa di-handle langsung
            $directResult = $this->tryDirectAction($request->message);

            if ($directResult) {
                $systemPrompt .= "\n\nHASIL QUERY DATABASE TERBARU:\n" . json_encode($directResult, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                $systemPrompt .= "\n\nPENTING: Sajikan seluruh data di atas ke dalam respons Anda secara lengkap dan akurat.";
            }

            // Kirim ke Gemini (gemini-3.5-flash-lite dengan paksa IPv4 untuk DNS instan)
            $apiKey = env('GEMINI_API_KEY');
            $aiText = '';

            try {
                $response = Http::withoutVerifying()
                    ->withOptions([
                        'connect_timeout' => 8,
                        'curl' => [
                            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
                        ]
                    ])
                    ->timeout(20)
                    ->post(
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

                if ($response->successful()) {
                    $body = $response->json();
                    $parts = $body['candidates'][0]['content']['parts'] ?? [];
                    foreach ($parts as $part) {
                        if (isset($part['text'])) {
                            $aiText .= $part['text'];
                        }
                    }
                } else {
                    Log::warning('Gemini API Non-200: ' . $response->body());
                }
            } catch (\Throwable $apiEx) {
                Log::warning('Gemini Connection issue (using DB fallback): ' . $apiEx->getMessage());
            }

            // Jika Gemini tidak merespon tapi ada hasil query DB, buatkan respon langsung:
            if (empty(trim($aiText))) {
                if ($directResult) {
                    $aiText = $this->formatDirectResultToMarkdown($directResult);
                } else {
                    $aiText = "Halo! Saya adalah SIMRS AI Assistant. Saya bisa membantu Anda memeriksa data pegawai, melihat daftar grup, statistik hak akses, dan info sistem SIMRS. Silakan ketik pertanyaan Anda!";
                }
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
     * Format hasil query database langsung ke markdown yang rapi jika AI eksternal sedang lambat
     */
    private function formatDirectResultToMarkdown(array $result): string
    {
        switch ($result['type'] ?? '') {
            case 'statistik':
                $total = number_format($result['total_pegawai'], 0, ',', '.');
                $aktif = number_format($result['punya_akses'], 0, ',', '.');
                $belum = number_format($result['belum_akses'], 0, ',', '.');
                $pct = $result['total_pegawai'] > 0 ? round(($result['punya_akses'] / $result['total_pegawai']) * 100, 1) : 0;
                return "Berikut adalah **Statistik Data Pegawai & Hak Akses SIMRS** saat ini:\n\n" .
                       "| Kategori | Jumlah |\n" .
                       "| :--- | :---: |\n" .
                       "| **Total Pegawai** | **{$total} orang** |\n" .
                       "| Pegawai Punya Akses | {$aktif} orang ({$pct}%) |\n" .
                       "| Pegawai Belum Punya Akses | {$belum} orang |\n\n" .
                       "💡 *Data diambil langsung secara real-time dari database SIMRS.*";

            case 'search_pegawai':
                if (empty($result['data']) || count($result['data']) === 0) {
                    return "Tidak ditemukan pegawai dengan kata kunci **\"{$result['keyword']}\"** di database.";
                }
                $out = "Ditemukan **{$result['count']} pegawai** untuk pencarian **\"{$result['keyword']}\"**:\n\n" .
                       "| NIK | Nama Pegawai | Jabatan |\n" .
                       "| :--- | :--- | :--- |\n";
                foreach ($result['data'] as $p) {
                    $out .= "| `{$p->nik}` | **{$p->nama}** | " . ($p->jbtn ?: '-') . " |\n";
                }
                return $out;

            case 'detail_akses':
                $out = "Detail hak akses untuk **{$result['nama']}** (NIK: `{$result['nik']}`):\n\n";
                $activeCount = 0;
                $activeList = [];
                foreach ($result['akses'] as $col => $val) {
                    if ($val === 'true' || $val === '1' || $val === true) {
                        $activeCount++;
                        $activeList[] = "`$col`";
                    }
                }
                $out .= "• Status: Memiliki **{$activeCount} hak akses aktif**\n";
                if ($activeCount > 0) {
                    $out .= "• Modul aktif: " . implode(', ', array_slice($activeList, 0, 15)) . (count($activeList) > 15 ? " ...dan " . (count($activeList) - 15) . " lainnya" : "") . "\n";
                }
                return $out;

            case 'anggota_group':
                if (empty($result['data']) || count($result['data']) === 0) {
                    return "Grup **\"{$result['group']}\"** belum memiliki anggota yang terdaftar.";
                }
                $out = "Daftar anggota untuk grup **\"{$result['group']}\"** ({$result['count']} orang):\n\n" .
                       "| NIK | Nama Pegawai | Jabatan | Peran |\n" .
                       "| :--- | :--- | :--- | :--- |\n";
                foreach ($result['data'] as $a) {
                    $peran = $a->is_leader ? "👑 **Leader**" : "Anggota";
                    $out .= "| `{$a->nik}` | {$a->nama} | " . ($a->jbtn ?: '-') . " | {$peran} |\n";
                }
                return $out;

            case 'list_group':
                $out = "Berikut daftar **Grup User** yang terdaftar di SIMRS ({$result['count']} grup):\n\n" .
                       "| Nama Group | Jumlah Anggota |\n" .
                       "| :--- | :---: |\n";
                foreach ($result['data'] as $g) {
                    $out .= "| **{$g->nama_group}** | {$g->jumlah_anggota} orang |\n";
                }
                return $out;

            default:
                return "Data berhasil diproses dari database SIMRS.";
        }
    }

    /**
     * Deteksi perintah sederhana dan query DB langsung — agar AI punya data nyata untuk dijawab.
     */
    private function tryDirectAction(string $message): ?array
    {
        $msg = strtolower(trim($message));

        // 1. Cek Pencarian Anggota Group secara Dinamis berdasarkan nama group yang ada di DB
        $allGroups = DB::table('group_users')->get();
        foreach ($allGroups as $group) {
            if (stripos($message, $group->nama_group) !== false) {
                // Jika pesan menanyakan anggota/siapa/member/staf/isi/leader grup ini
                if (preg_match('/(?:siapa|anggota|member|daftar|list|isi|staf|pegawai|orang|user|leader|lihat|tampilkan)/i', $message)) {
                    $anggota = DB::table('user_to_group_users')
                        ->leftJoin('pegawai', 'pegawai.nik', '=', 'user_to_group_users.nik_pegawai')
                        ->where('user_to_group_users.id_group', $group->id)
                        ->select('pegawai.nik', 'pegawai.nama', 'pegawai.jbtn', 'user_to_group_users.is_leader')
                        ->orderBy('user_to_group_users.is_leader', 'desc')
                        ->get();

                    return [
                        'type' => 'anggota_group',
                        'group' => $group->nama_group,
                        'group_id' => $group->id,
                        'count' => $anggota->count(),
                        'data' => $anggota
                    ];
                }
            }
        }

        // 2. Cek Pencarian Spesifik NIK (angka 4-25 digit)
        if (preg_match('/\b(\d{4,25})\b/', $message, $m)) {
            $nik = $m[1];
            $user = DB::table('user')->where('id_user_plain', $nik)->first();
            $pegawai = DB::table('pegawai')->where('nik', $nik)->first();
            if ($pegawai) {
                $aksesData = [];
                if ($user) {
                    foreach ($user as $key => $value) {
                        if (!in_array($key, ['id_user', 'id_user_plain', 'password'])) {
                            $aksesData[$key] = $value;
                        }
                    }
                }
                return [
                    'type' => 'detail_akses',
                    'nik' => $nik,
                    'nama' => $pegawai->nama,
                    'jbtn' => $pegawai->jbtn,
                    'has_user' => $user !== null,
                    'akses' => $aksesData
                ];
            }
        }

        // 3. List Semua Group
        if (preg_match('/(?:daftar|list|semua|tampilkan|apa saja|ada apa|jumlah)\s+(?:grup|group)/i', $message) || preg_match('/^(?:group|grup|list group|daftar group)$/i', $msg)) {
            $groups = DB::table('group_users')
                ->leftJoin('user_to_group_users', 'group_users.id', '=', 'user_to_group_users.id_group')
                ->select('group_users.id', 'group_users.nama_group', DB::raw('COUNT(user_to_group_users.id) as jumlah_anggota'))
                ->groupBy('group_users.id', 'group_users.nama_group')
                ->orderByDesc('jumlah_anggota')
                ->get();
            return ['type' => 'list_group', 'count' => $groups->count(), 'data' => $groups];
        }

        // 4. Hitung Total Pegawai & Statistik Akun
        if (preg_match('/(?:berapa|total|jumlah|banyak|rekap|statistik|overview|dashboard|data)\s*(?:semua|total\s*)?(?:pegawai|karyawan|user|staf|staff|akun)/i', $message) || preg_match('/^(?:total|statistik|rekap)\s*(?:pegawai|user)?$/i', $msg)) {
            $total = DB::table('pegawai')->count();
            $withAccess = DB::table('pegawai')
                ->leftJoin('user', 'user.id_user_plain', '=', 'pegawai.nik')
                ->whereNotNull('user.id_user_plain')
                ->count();
            return [
                'type' => 'statistik',
                'total_pegawai' => $total,
                'punya_akses' => $withAccess,
                'belum_akses' => $total - $withAccess
            ];
        }

        // 5. Cari Pegawai by Nama
        if (preg_match('/(?:cari|search|tampilkan|lihat|siapa|info|data)\s+(?:pegawai|karyawan|user|staff|staf|dokter|perawat|bidan)?\s*(?:bernama|nama|dengan nama)?\s*[:\s]?\s*([a-zA-Z0-9\s,\.\']+)/i', $message, $m)) {
            $keyword = trim($m[1], ' "\'?.');
            $keyword = preg_replace('/^(?:yang\s+bernama|bernama|nama)\s+/i', '', $keyword);
            if (strlen($keyword) >= 2 && !in_array(strtolower($keyword), ['group', 'grup', 'user', 'pegawai', 'semua', 'total'])) {
                $results = DB::table('pegawai')
                    ->select('nik', 'nama', 'jbtn')
                    ->where('nama', 'like', "%{$keyword}%")
                    ->limit(15)
                    ->get();
                if ($results->isNotEmpty()) {
                    return ['type' => 'search_pegawai', 'keyword' => $keyword, 'count' => $results->count(), 'data' => $results];
                }
            }
        }

        return null;
    }

    private function formatColumns(array $columns): string
    {
        return implode(', ', array_values($columns));
    }
}
