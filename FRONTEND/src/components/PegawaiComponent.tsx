import { useEffect, useState } from 'react';
import PegawaiStore from '../store/PegawaiStore';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Breadcrumb, Table } from 'flowbite-react';
import DataFetchingNotFound from './DataFetchingNotFound';
import SearchBoxComponent from './SearchBoxComponent';
import UserService from '../utils/UserService';
import { Bounce, toast } from 'react-toastify';
import DatabaseModeToggle from './DatabaseModeToggle';

function PegawaiComponent() {
    const { pegawais, pagination, fetchDataPegawai } = PegawaiStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const isBandingkan = location.pathname === '/bandingkan-akses';

    // State untuk mode bandingkan
    const [userA, setUserA] = useState<{ nik: string; nama: string } | null>(null);
    const [userB, setUserB] = useState<{ nik: string; nama: string } | null>(null);
    const [aksesA, setAksesA] = useState<Record<string, any> | null>(null);
    const [aksesB, setAksesB] = useState<Record<string, any> | null>(null);
    const [loadingCopy, setLoadingCopy] = useState(false);
    const [searchA, setSearchA] = useState('');
    const [searchB, setSearchB] = useState('');
    const [debouncedA, setDebouncedA] = useState('');
    const [debouncedB, setDebouncedB] = useState('');
    const [pegawaisB, setPegawaisB] = useState<typeof pegawais>([]);
    const [paginationB, setPaginationB] = useState<typeof pagination>(null);
    const [pageA, setPageA] = useState(1);
    const [pageB, setPageB] = useState(1);

    // Debounce search A & B - kurangi delay jadi 200ms
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedA(searchA);
            setPageA(1); // Reset ke page 1 saat search berubah
        }, 200); // Kurangi dari 300ms ke 200ms
        return () => clearTimeout(t);
    }, [searchA]);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedB(searchB);
            setPageB(1); // Reset ke page 1 saat search berubah
        }, 200); // Kurangi dari 300ms ke 200ms
        return () => clearTimeout(t);
    }, [searchB]);

    // Fetch untuk mode normal
    useEffect(() => {
        if (!isBandingkan) {
            const params = new URLSearchParams(searchParams);
            // Set default page jika tidak ada
            if (!params.has('page')) {
                params.set('page', '1');
            }
            const queryString = params.toString();
            fetchDataPegawai(queryString ? `?${queryString}` : '?page=1');
        }
    }, [searchParams, isBandingkan]);

    // Handler pagination
    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        setSearchParams(params);
    };

    // Handler database mode change
    const handleDatabaseModeChange = () => {
        // Refresh data setelah switch database
        const params = new URLSearchParams(searchParams);
        if (!params.has('page')) {
            params.set('page', '1');
        }
        const queryString = params.toString();
        fetchDataPegawai(queryString ? `?${queryString}` : '?page=1');
    };

    // Fetch panel A (dengan pagination untuk performa)
    useEffect(() => {
        if (isBandingkan) {
            fetchDataPegawai(`?search=${debouncedA}&page=${pageA}`);
        }
    }, [debouncedA, pageA, isBandingkan]);

    // Fetch panel B (gunakan state lokal sendiri, dengan pagination)
    useEffect(() => {
        if (isBandingkan) {
            import('../utils/PegawaiService').then(mod => {
                mod.default.getAll(`?search=${debouncedB}&page=${pageB}`).then(result => {
                    setPegawaisB(result.data || []);
                    setPaginationB(result.pagination || null);
                });
            });
        }
    }, [debouncedB, pageB, isBandingkan]);

    const handlePilihUserA = async (nik: string, nama: string) => {
        setUserA({ nik, nama });
        try {
            const data = await UserService.getDetail(nik);
            setAksesA(data);
        } catch {
            setAksesA(null);
        }
    };

    const handlePilihUserB = async (nik: string, nama: string) => {
        setUserB({ nik, nama });
        try {
            const data = await UserService.getDetail(nik);
            setAksesB(data);
        } catch {
            setAksesB(null);
        }
    };

    const handleDeleteUser = async (nik: string, nama: string) => {
        if (!window.confirm(`Hapus akses user "${nama}" (${nik})? Data akses user ini akan dihapus permanen.`)) return;
        try {
            await UserService.deleteUser(nik);
            toast.success(`Akses user ${nama} berhasil dihapus`, {
                position: 'top-right', autoClose: 5000, theme: 'colored', transition: Bounce,
            });
            const queryString = searchParams.toString();
            fetchDataPegawai(queryString ? `?${queryString}` : '');
        } catch {
            toast.error(`Gagal menghapus akses user ${nama}`, {
                position: 'top-right', autoClose: 5000, theme: 'colored', transition: Bounce,
            });
        }
    };

    const handleCopy = async (arahAkeB: boolean) => {
        if (!userA || !userB) return;
        const sumber = arahAkeB ? userA.nik : userB.nik;
        const tujuan = arahAkeB ? userB.nik : userA.nik;
        const labelSumber = arahAkeB ? userA.nama : userB.nama;
        const labelTujuan = arahAkeB ? userB.nama : userA.nama;

        if (!window.confirm(`Copy akses "${labelSumber}" → "${labelTujuan}"?`)) return;
        setLoadingCopy(true);
        try {
            await UserService.copyAkses(sumber, tujuan);
            toast.success(`Akses ${labelSumber} berhasil dicopy ke ${labelTujuan}`, {
                position: 'top-right', autoClose: 5000, theme: 'colored', transition: Bounce,
            });
            // Refresh akses tujuan agar tabel perbandingan update
            const refreshed = await UserService.getDetail(tujuan);
            if (arahAkeB) setAksesB(refreshed);
            else setAksesA(refreshed);
        } catch {
            toast.error('Gagal melakukan copy akses', {
                position: 'top-right', autoClose: 5000, theme: 'colored', transition: Bounce,
            });
        } finally {
            setLoadingCopy(false);
        }
    };

    // Kolom akses yang dikecualikan dari perbandingan
    const EXCLUDED = ['nama', 'id_user', 'id_user_plain', 'password'];

    // Kumpulkan semua key akses dari A dan B
    const allKeys = aksesA && aksesB
        ? Array.from(new Set([
            ...Object.keys(aksesA).filter(k => !EXCLUDED.includes(k)),
            ...Object.keys(aksesB).filter(k => !EXCLUDED.includes(k)),
          ]))
        : [];

    // ─── MODE NORMAL (/pegawai) ─────────────────────────────────────
    if (!isBandingkan) {
        return (
            <div className='overflow-hidden py-3 pr-3 grid grid-rows-[5rem_1fr] gap-4'>
                <div className="text-gray-600">
                    <h1 className="font-bold text-3xl mb-2">Data User Pegawai</h1>
                    <Breadcrumb>
                        <Breadcrumb.Item href="/">Pegawai</Breadcrumb.Item>
                    </Breadcrumb>
                </div>

                <div className="bg-white rounded-md border shadow-sm overflow-auto w-full h-full">
                    <div className="w-full p-4 flex justify-between items-center gap-6">
                        <SearchBoxComponent placeHolder="Cari nama atau nik pegawai" />
                        <DatabaseModeToggle onModeChange={handleDatabaseModeChange} />
                    </div>

                    {pegawais.length > 0 ? (
                        <Table striped className="text-base">
                            <Table.Head className="sticky top-0 z-10 bg-white h-20 border-b">
                                <Table.HeadCell className="text-center w-20">NO</Table.HeadCell>
                                <Table.HeadCell className="text-center">NIK</Table.HeadCell>
                                <Table.HeadCell className="text-center">Nama</Table.HeadCell>
                                <Table.HeadCell className="text-center">Jabatan</Table.HeadCell>
                                <Table.HeadCell className="text-center">Grup User</Table.HeadCell>
                                <Table.HeadCell className="text-center w-[12rem]">Kontrol</Table.HeadCell>
                            </Table.Head>
                            <Table.Body className="divide-y">
                                {pegawais.map((item, index) => (
                                    <Table.Row className="bg-white" key={item.id}>
                                        <Table.Cell className="font-bold text-center">{index + 1}</Table.Cell>
                                        <Table.Cell>{item.nik}</Table.Cell>
                                        <Table.Cell>
                                            <div className="flex items-center gap-2">
                                                {item.nama}
                                                {!item.has_user && (
                                                    <span className="text-xs font-medium text-orange-500 bg-orange-50 border border-orange-200 rounded px-2 py-0.5 whitespace-nowrap">
                                                        Belum punya akses
                                                    </span>
                                                )}
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>{item.jbtn}</Table.Cell>
                                        <Table.Cell className="text-center">
                                            {item.nama_group ? (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                    item.is_leader 
                                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                    {item.nama_group}
                                                    {item.is_leader ? (
                                                        <span className="text-[10px] font-bold bg-green-200 text-green-800 px-1 py-0.2 rounded-sm ml-1">
                                                            Leader
                                                        </span>
                                                    ) : null}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm italic">-</span>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="w-full flex items-center justify-center gap-6">
                                                <Link to={`/detail-user/${item.nik}`}>
                                                    <button className="font-medium text-cyan-600 hover:underline active:scale-95">
                                                        Edit
                                                    </button>
                                                </Link>
                                                {item.has_user ? (
                                                    <button
                                                        onClick={() => handleDeleteUser(item.nik, item.nama)}
                                                        className="font-medium text-red-600 hover:underline active:scale-95"
                                                    >
                                                        Hapus Akses
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300 text-sm cursor-default">Hapus Akses</span>
                                                )}
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    ) : (<DataFetchingNotFound />)}

                    {/* Pagination Controls */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <div className="text-sm text-gray-600">
                                Menampilkan {((pagination.current_page - 1) * pagination.per_page) + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {pagination.total} pegawai
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-2">
                                    {[...Array(Math.min(5, pagination.last_page))].map((_, idx) => {
                                        let pageNum;
                                        if (pagination.last_page <= 5) {
                                            pageNum = idx + 1;
                                        } else if (pagination.current_page <= 3) {
                                            pageNum = idx + 1;
                                        } else if (pagination.current_page >= pagination.last_page - 2) {
                                            pageNum = pagination.last_page - 4 + idx;
                                        } else {
                                            pageNum = pagination.current_page - 2 + idx;
                                        }
                                        
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                    pagination.current_page === pageNum
                                                        ? 'bg-cyan-500 text-white'
                                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── MODE BANDINGKAN (/bandingkan-akses) ────────────────────────
    return (
        <div className='overflow-hidden py-3 pr-3 grid grid-rows-[auto_auto_1fr] gap-4'>
            {/* Header */}
            <div className="text-gray-600">
                <h1 className="font-bold text-3xl mb-2">Bandingkan Akses</h1>
                <Breadcrumb>
                    <Breadcrumb.Item href="/bandingkan-akses">Bandingkan Akses</Breadcrumb.Item>
                </Breadcrumb>
            </div>

            {/* Panel pilih user A dan B */}
            <div className="grid grid-cols-2 gap-4" style={{ maxHeight: '350px' }}>
                {/* Panel A */}
                <div className="bg-white rounded-md border shadow-sm flex flex-col overflow-hidden">
                    <div className="p-3 border-b flex items-center gap-3">
                        <span className="font-semibold text-gray-600 whitespace-nowrap">User A:</span>
                        {userA
                            ? <span className="text-cyan-600 font-medium">{userA.nama} ({userA.nik})</span>
                            : <span className="text-gray-400 text-sm">Belum dipilih</span>
                        }
                        <input
                            type="search"
                            placeholder="Cari pegawai..."
                            value={searchA}
                            onChange={e => setSearchA(e.target.value)}
                            className="ml-auto px-2 py-1 border border-gray-200 rounded-md bg-gray-50 outline-none text-sm w-44"
                        />
                    </div>
                    <div className="overflow-auto flex-1">
                        {pegawais && pegawais.length > 0 ? (
                            <Table striped className="text-sm">
                                <Table.Head className="sticky top-0 bg-white">
                                    <Table.HeadCell className="w-8"></Table.HeadCell>
                                    <Table.HeadCell>NIK</Table.HeadCell>
                                    <Table.HeadCell>Nama</Table.HeadCell>
                                    <Table.HeadCell>Jabatan</Table.HeadCell>
                                </Table.Head>
                                <Table.Body className="divide-y">
                                    {pegawais.map(item => (
                                        <Table.Row
                                            key={item.id}
                                            className={`cursor-pointer ${userA?.nik === item.nik ? 'bg-cyan-50' : 'bg-white'}`}
                                            onClick={() => handlePilihUserA(item.nik, item.nama)}
                                        >
                                            <Table.Cell className="text-center">
                                                <input type="radio" readOnly checked={userA?.nik === item.nik} className="accent-cyan-500" />
                                            </Table.Cell>
                                            <Table.Cell>{item.nik}</Table.Cell>
                                            <Table.Cell>
                                                <div className="flex flex-col">
                                                    <span>{item.nama}</span>
                                                    {item.nama_group && (
                                                        <span className="text-[11px] text-gray-500 font-medium italic mt-0.5">
                                                            Grup: {item.nama_group} {item.is_leader ? '(Leader)' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell>{item.jbtn}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        ) : <DataFetchingNotFound />}
                    </div>
                    {/* Pagination Panel A */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="p-2 border-t flex items-center justify-between text-xs">
                            <span className="text-gray-500">Hal {pagination.current_page}/{pagination.last_page}</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setPageA(prev => Math.max(1, prev - 1))}
                                    disabled={pageA === 1}
                                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                                >
                                    ◀
                                </button>
                                <button
                                    onClick={() => setPageA(prev => Math.min(pagination.last_page, prev + 1))}
                                    disabled={pageA === pagination.last_page}
                                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                                >
                                    ▶
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Panel B */}
                <div className="bg-white rounded-md border shadow-sm flex flex-col overflow-hidden">
                    <div className="p-3 border-b flex items-center gap-3">
                        <span className="font-semibold text-gray-600 whitespace-nowrap">User B:</span>
                        {userB
                            ? <span className="text-purple-600 font-medium">{userB.nama} ({userB.nik})</span>
                            : <span className="text-gray-400 text-sm">Belum dipilih</span>
                        }
                        <input
                            type="search"
                            placeholder="Cari pegawai..."
                            value={searchB}
                            onChange={e => setSearchB(e.target.value)}
                            className="ml-auto px-2 py-1 border border-gray-200 rounded-md bg-gray-50 outline-none text-sm w-44"
                        />
                    </div>
                    <div className="overflow-auto flex-1">
                        {pegawaisB.length > 0 ? (
                            <Table striped className="text-sm">
                                <Table.Head className="sticky top-0 bg-white">
                                    <Table.HeadCell className="w-8"></Table.HeadCell>
                                    <Table.HeadCell>NIK</Table.HeadCell>
                                    <Table.HeadCell>Nama</Table.HeadCell>
                                    <Table.HeadCell>Jabatan</Table.HeadCell>
                                </Table.Head>
                                <Table.Body className="divide-y">
                                    {pegawaisB.map(item => (
                                        <Table.Row
                                            key={item.id}
                                            className={`cursor-pointer ${userB?.nik === item.nik ? 'bg-purple-50' : 'bg-white'}`}
                                            onClick={() => handlePilihUserB(item.nik, item.nama)}
                                        >
                                            <Table.Cell className="text-center">
                                                <input type="radio" readOnly checked={userB?.nik === item.nik} className="accent-purple-500" />
                                            </Table.Cell>
                                            <Table.Cell>{item.nik}</Table.Cell>
                                            <Table.Cell>
                                                <div className="flex flex-col">
                                                    <span>{item.nama}</span>
                                                    {item.nama_group && (
                                                        <span className="text-[11px] text-gray-500 font-medium italic mt-0.5">
                                                            Grup: {item.nama_group} {item.is_leader ? '(Leader)' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell>{item.jbtn}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        ) : <DataFetchingNotFound />}
                    </div>
                    {/* Pagination Panel B */}
                    {paginationB && paginationB.last_page > 1 && (
                        <div className="p-2 border-t flex items-center justify-between text-xs">
                            <span className="text-gray-500">Hal {paginationB.current_page}/{paginationB.last_page}</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setPageB(prev => Math.max(1, prev - 1))}
                                    disabled={pageB === 1}
                                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                                >
                                    ◀
                                </button>
                                <button
                                    onClick={() => setPageB(prev => Math.min(paginationB.last_page, prev + 1))}
                                    disabled={pageB === paginationB.last_page}
                                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                                >
                                    ▶
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tombol copy & tabel perbandingan */}
            <div className="bg-white rounded-md border shadow-sm overflow-auto w-full h-full flex flex-col">
                {/* Tombol copy */}
                <div className="p-4 border-b flex items-center gap-4 flex-wrap">
                    <span className="text-sm text-gray-500">
                        {userA && userB ? `${userA.nama} ↔ ${userB.nama}` : 'Pilih User A dan User B untuk membandingkan akses'}
                    </span>
                    <div className="ml-auto flex gap-3">
                        <button
                            onClick={() => handleCopy(true)}
                            disabled={!userA || !userB || loadingCopy}
                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loadingCopy ? 'Memproses...' : `Copy A → B`}
                        </button>
                        <button
                            onClick={() => handleCopy(false)}
                            disabled={!userA || !userB || loadingCopy}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loadingCopy ? 'Memproses...' : `Copy B → A`}
                        </button>
                    </div>
                </div>

                {/* Tabel perbandingan */}
                {aksesA && aksesB && allKeys.length > 0 ? (
                    <div className="overflow-auto flex-1">
                        <Table striped className="text-sm">
                            <Table.Head className="sticky top-0 bg-white z-10">
                                <Table.HeadCell>Nama Akses</Table.HeadCell>
                                <Table.HeadCell className="text-center text-cyan-600">
                                    {userA?.nama ?? 'User A'}
                                </Table.HeadCell>
                                <Table.HeadCell className="text-center text-purple-600">
                                    {userB?.nama ?? 'User B'}
                                </Table.HeadCell>
                            </Table.Head>
                            <Table.Body className="divide-y">
                                {allKeys.map(key => {
                                    const valA = String(aksesA[key] ?? '-');
                                    const valB = String(aksesB[key] ?? '-');
                                    const beda = valA !== valB;
                                    return (
                                        <Table.Row key={key} className={beda ? 'bg-yellow-50' : 'bg-white'}>
                                            <Table.Cell className="font-medium">
                                                {beda && <span className="mr-2 text-yellow-500">●</span>}
                                                {key}
                                            </Table.Cell>
                                            <Table.Cell className={`text-center font-medium ${valA === 'true' ? 'text-green-500' : valA === 'false' ? 'text-red-400' : 'text-gray-400'}`}>
                                                {valA}
                                            </Table.Cell>
                                            <Table.Cell className={`text-center font-medium ${valB === 'true' ? 'text-green-500' : valB === 'false' ? 'text-red-400' : 'text-gray-400'}`}>
                                                {valB}
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                        {!userA || !userB
                            ? 'Pilih dua pegawai di atas untuk melihat perbandingan akses'
                            : 'Memuat data akses...'}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PegawaiComponent
