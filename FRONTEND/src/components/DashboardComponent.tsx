import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Breadcrumb } from "flowbite-react";
import { 
    HiUsers, 
    HiShieldCheck, 
    HiUserAdd, 
    HiUserGroup, 
    HiRefresh, 
    HiExclamation, 
    HiCheckCircle, 
    HiArrowRight,
    HiViewBoards,
    HiSparkles,
    HiBadgeCheck
} from "react-icons/hi";
import DashboardService from "../utils/DashboardService";
import { DashboardData } from "../interface/DashboardInterface";
import DatabaseModeToggle from "./DatabaseModeToggle";

function DashboardComponent() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadStats = async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) setIsRefreshing(true);
        else setIsLoading(true);
        setError(null);

        try {
            const result = await DashboardService.getStats();
            setData(result);
        } catch (err: any) {
            console.error("Dashboard error:", err);
            setError(err?.response?.data?.message || err.message || "Gagal memuat data dashboard.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadStats();

        // Listen to Database Mode Toggle events (otomatis refresh saat DEV/PROD di-switch)
        const handleModeChange = () => {
            loadStats(true);
        };

        window.addEventListener("db-mode-changed", handleModeChange);
        window.addEventListener("storage", handleModeChange);

        return () => {
            window.removeEventListener("db-mode-changed", handleModeChange);
            window.removeEventListener("storage", handleModeChange);
        };
    }, []);

    const maxGroupCount = data?.charts?.distribusi_group?.length 
        ? Math.max(...data.charts.distribusi_group.map(g => g.total_anggota), 1)
        : 1;

    const maxJabatanCount = data?.charts?.top_jabatan?.length 
        ? Math.max(...data.charts.top_jabatan.map(j => j.total), 1)
        : 1;

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Breadcrumb aria-label="Breadcrumb" className="mb-2">
                        <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                        <Breadcrumb.Item>Statistik & Keamanan Hak Akses</Breadcrumb.Item>
                    </Breadcrumb>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
                        <span>Overview Hak Akses SIMRS</span>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold border border-indigo-200">
                            Live Database
                        </span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Ringkasan metrik adopsi akun, distribusi grup peran, dan audit keamanan SIMRS.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <DatabaseModeToggle />
                    <button
                        onClick={() => loadStats(true)}
                        disabled={isRefreshing || isLoading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-95 rounded-lg shadow-sm font-medium text-xs sm:text-sm transition-all disabled:opacity-50"
                        title="Refresh data terbaru"
                    >
                        <HiRefresh className={`w-4 h-4 text-indigo-600 ${isRefreshing ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">{isRefreshing ? "Memperbarui..." : "Refresh"}</span>
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <HiExclamation className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                    <button 
                        onClick={() => loadStats()}
                        className="text-xs underline font-bold hover:text-red-900 ml-4"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}

            {/* Loading Skeleton */}
            {isLoading && !data && (
                <div className="space-y-6 animate-pulse">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-72 bg-gray-200 rounded-xl"></div>
                        <div className="h-72 bg-gray-200 rounded-xl"></div>
                    </div>
                </div>
            )}

            {data && (
                <>
                    {/* 1. TOP KPI METRIC CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* KPI 1: Total Pegawai */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Pegawai</p>
                                    <p className="text-2xl sm:text-3xl font-black text-gray-800 mt-1">
                                        {data.kpi.total_pegawai.toLocaleString("id-ID")}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Staf terdaftar di sistem</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <HiUsers className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                        </div>

                        {/* KPI 2: User Aktif Ber-Hak Akses */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">User Ber-Hak Akses</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <p className="text-2xl sm:text-3xl font-black text-emerald-600">
                                            {data.kpi.user_aktif.toLocaleString("id-ID")}
                                        </p>
                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                            {data.kpi.persentase_akses}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Akun login aktif di SIMRS</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <HiShieldCheck className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(data.kpi.persentase_akses, 100)}%` }}
                                ></div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
                        </div>

                        {/* KPI 3: Pegawai Belum Punya Akun */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Belum Punya Akses</p>
                                    <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                                        {data.kpi.user_belum_akses.toLocaleString("id-ID")}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Perlu dibuatkan akun user</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <HiUserAdd className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400"></div>
                        </div>

                        {/* KPI 4: Total Group Role */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Group Peran</p>
                                    <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">
                                        {data.kpi.total_group.toLocaleString("id-ID")}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {data.kpi.pegawai_dalam_group} pegawai terikat grup
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <HiUserGroup className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-400"></div>
                        </div>
                    </div>

                    {/* 2. VISUAL CHARTS & DISTRIBUTIONS */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Chart 1: Distribusi Anggota per Group Role (7 Cols) */}
                        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-800">Distribusi Anggota per Group User</h2>
                                        <p className="text-xs text-gray-400">Jumlah pegawai yang terkelompokkan dalam grup peran</p>
                                    </div>
                                    <Link 
                                        to="/group-user" 
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                    >
                                        Kelola Group <HiArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>

                                {data.charts.distribusi_group.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        Belum ada data group user yang terdaftar.
                                    </div>
                                ) : (
                                    <div className="space-y-3.5">
                                        {data.charts.distribusi_group.slice(0, 6).map((group) => {
                                            const percent = Math.round((group.total_anggota / maxGroupCount) * 100);
                                            return (
                                                <div key={group.id} className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Link 
                                                                to={`/group-user/${group.id}`}
                                                                className="font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
                                                            >
                                                                {group.nama_group}
                                                            </Link>
                                                            {group.has_leader ? (
                                                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                                                                    👑 Leader Ready
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                                                                    ⚠️ Belum Ada Leader
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-gray-600">
                                                            {group.total_anggota} orang
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                        <div 
                                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                                group.has_leader 
                                                                    ? "bg-gradient-to-r from-indigo-500 to-purple-500" 
                                                                    : "bg-gradient-to-r from-amber-400 to-orange-400"
                                                            }`}
                                                            style={{ width: `${Math.max(percent, 4)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {data.charts.distribusi_group.length > 6 && (
                                <p className="text-[11px] text-gray-400 text-right mt-3">
                                    + {data.charts.distribusi_group.length - 6} group lainnya di halaman Group User
                                </p>
                            )}
                        </div>

                        {/* Chart 2: Top 7 Jabatan Pegawai (5 Cols) */}
                        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-800">Top Jabatan Pegawai</h2>
                                        <p className="text-xs text-gray-400">Pengelompokan profesi terbanyak di RS</p>
                                    </div>
                                    <Link 
                                        to="/" 
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                    >
                                        Semua Pegawai <HiArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>

                                {data.charts.top_jabatan.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        Data jabatan pegawai belum tersedia.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {data.charts.top_jabatan.map((item, idx) => {
                                            const percent = Math.round((item.total / maxJabatanCount) * 100);
                                            return (
                                                <div key={idx} className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-medium text-gray-700 truncate max-w-[180px]">
                                                            {item.jabatan}
                                                        </span>
                                                        <span className="font-bold text-gray-600">{item.total}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                        <div 
                                                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.max(percent, 5)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Status Akun Ring Visual Summary */}
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                <span className="text-gray-500 font-medium">Adopsi Login SIMRS:</span>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        {data.kpi.user_aktif} Punya Akses
                                    </span>
                                    <span className="flex items-center gap-1 text-amber-700 font-bold">
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                        {data.kpi.user_belum_akses} Belum
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. SECURITY AUDIT & INSIGHTS (3 Column Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Audit 1: Group Tanpa Leader */}
                        <div className="bg-white rounded-xl p-5 border border-amber-200/80 bg-gradient-to-b from-amber-50/20 to-white shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                                        <HiExclamation className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800">Grup Belum Punya Leader</h3>
                                        <p className="text-[11px] text-gray-400">Leader dibutuhkan untuk copy akses massal</p>
                                    </div>
                                </div>

                                {data.security_audit.group_tanpa_leader.length === 0 ? (
                                    <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg flex items-center gap-2 font-medium">
                                        <HiCheckCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>Semua group sudah memiliki Leader!</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {data.security_audit.group_tanpa_leader.map((group) => (
                                            <div 
                                                key={group.id}
                                                className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-lg flex items-center justify-between text-xs"
                                            >
                                                <div>
                                                    <p className="font-bold text-gray-800">{group.nama_group}</p>
                                                    <p className="text-[10px] text-gray-500">{group.total_anggota} anggota</p>
                                                </div>
                                                <Link 
                                                    to={`/group-user/${group.id}`}
                                                    className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold shadow-xs transition-colors"
                                                >
                                                    Set Leader
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Audit 2: Pegawai Belum Terikat Group */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                        <HiUsers className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800">Pegawai Luar Group</h3>
                                        <p className="text-[11px] text-gray-400">Total {data.kpi.pegawai_luar_group} staf belum masuk grup</p>
                                    </div>
                                </div>

                                {data.security_audit.pegawai_terbaru_tanpa_group.length === 0 ? (
                                    <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg flex items-center gap-2 font-medium">
                                        <HiCheckCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>Semua pegawai sudah terdaftar dalam grup!</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {data.security_audit.pegawai_terbaru_tanpa_group.map((p) => (
                                            <div 
                                                key={p.nik}
                                                className="p-2 border border-gray-100 rounded-lg flex items-center justify-between text-xs hover:bg-gray-50/60"
                                            >
                                                <div className="truncate max-w-[180px]">
                                                    <p className="font-semibold text-gray-800 truncate">{p.nama}</p>
                                                    <p className="text-[10px] text-gray-400">{p.nik} • {p.jbtn || "Staff"}</p>
                                                </div>
                                                {p.has_user ? (
                                                    <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                                        Punya Akses
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                                                        No User
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Audit 3: Leader Group Aktif */}
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                        <HiBadgeCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800">Daftar Leader Unit Aktif</h3>
                                        <p className="text-[11px] text-gray-400">Penanggung jawab template akses</p>
                                    </div>
                                </div>

                                {data.security_audit.daftar_leader_aktif.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 text-xs">
                                        Belum ada leader yang ditetapkan.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                        {data.security_audit.daftar_leader_aktif.map((leader) => (
                                            <div 
                                                key={leader.group_id}
                                                className="p-2 bg-gray-50/70 border border-gray-100 rounded-lg text-xs"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-indigo-700 text-[11px]">
                                                        {leader.nama_group}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {leader.nik_leader}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-gray-800 mt-0.5">{leader.nama_leader}</p>
                                                <p className="text-[10px] text-gray-500">{leader.jabatan_leader || "Leader"}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 4. QUICK ACTION SHORTCUTS */}
                    <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl backdrop-blur-xs">
                                <HiSparkles className="w-6 h-6 text-yellow-300" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm sm:text-base">Butuh Bantuan Analisis Akses Cepat?</h4>
                                <p className="text-xs text-indigo-200">
                                    Gunakan tombol AI Assistant di pojok kanan bawah untuk bertanya data SIMRS langsung.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <Link 
                                to="/bandingkan-akses"
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition-colors flex items-center gap-1.5"
                            >
                                <HiViewBoards className="w-4 h-4" /> Bandingkan Akses
                            </Link>
                            <Link 
                                to="/group-user"
                                className="px-3 py-1.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg text-xs font-bold shadow-sm transition-colors"
                            >
                                Atur Group User
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default DashboardComponent;
