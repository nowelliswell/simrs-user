import { Breadcrumb, Table } from "flowbite-react"
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import PegawaiStore from "../store/PegawaiStore";
import DataFetchingNotFound from "./DataFetchingNotFound";
import axios from "axios";
import { Bounce, toast } from "react-toastify";

interface Anggota {
    id: string;
    nik_pegawai: string;
    id_group: string;
    is_leader: boolean | number;
    nik: string;
    nama: string;
}

function TambahAnggota() {
    const { pegawais, pagination, fetchDataPegawai } = PegawaiStore();
    const [searchPegawai, setSearchPegawai] = useState('');
    const [searchAnggota, setSearchAnggota] = useState('');
    const [anggota, setAnggota] = useState<Anggota[]>([]);
    const { id } = useParams();
    const [debouncedSearchPegawai, setDebouncedSearchPegawai] = useState('');
    const [debouncedSearchAnggota, setDebouncedSearchAnggota] = useState('');
    const [pagePegawai, setPagePegawai] = useState(1);

    // Helper untuk get headers dengan database mode
    const getHeaders = () => {
        const mode = localStorage.getItem('db_mode') || 'development';
        return { 'X-Database-Mode': mode };
    };

    const handleInputChangePegawai = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchPegawai(event.target.value);
        setPagePegawai(1); // Reset ke halaman 1 saat pencarian berubah
    };

    const handleInputChangeAnggota = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchAnggota(event.target.value);
    };

    const getAnggota = useCallback(async () => {
        await axios.get(`${import.meta.env.VITE_API_URL}/api/anggota-group-user?idGroup=${id}&search=${debouncedSearchAnggota}`, { headers: getHeaders() }).then((response) => {
            setAnggota(response.data.data);
        }).catch((err) => {
            console.log(err);
        })
    }, [id, debouncedSearchAnggota]);

    useEffect(() => {
        getAnggota();
    }, [debouncedSearchAnggota]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchAnggota(searchAnggota); // Perbarui nilai debounced setelah delay
        }, 300); // Delay dalam milidetik

        return () => {
            clearTimeout(handler); // Hapus timeout sebelumnya
        };
    }, [searchAnggota]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchPegawai(searchPegawai); // Perbarui nilai debounced setelah delay
        }, 300); // Delay dalam milidetik

        return () => {
            clearTimeout(handler); // Hapus timeout sebelumnya
        };
    }, [searchPegawai]);

    useEffect(() => {
        fetchDataPegawai(`?search=${debouncedSearchPegawai}&page=${pagePegawai}&per_page=50`);
    }, [debouncedSearchPegawai, pagePegawai]);

    const addNewAnggota = useCallback(async (nik: string) => {
        try {
            console.log('Adding anggota:', { nik, id_group: id });
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/anggota-group-user`, 
                { 
                    'nik_pegawai': nik, 
                    'id_group': id 
                }, 
                { headers: getHeaders() }
            );
            await getAnggota();
            toast.success('Anggota berhasil ditambahkan.', {
                position: "top-right", autoClose: 5000, theme: "colored", transition: Bounce,
            });
        } catch (err) {
            console.error('Error adding anggota:', err);
            let errorMsg = 'Terjadi kesalahan saat menambahkan anggota.';
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.error || err.response?.data?.message || errorMsg;
            }
            toast.error(errorMsg, {
                position: "top-right", autoClose: 5000, theme: "colored", transition: Bounce,
            });
        }
    }, [id, getAnggota]);

    const hapusAnggota = useCallback(async (idAnggota: string) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/anggota-group-user/${idAnggota}`, { headers: getHeaders() });
            await getAnggota();
            toast.success('Anggota berhasil dihapus dari group.', {
                position: "top-right", autoClose: 5000, theme: "colored", transition: Bounce,
            });
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.response?.data?.error || 'Gagal menghapus anggota.';
            toast.error(errorMsg, {
                position: "top-right", autoClose: 5000, theme: "colored", transition: Bounce,
            });
            console.error(err);
        }
    }, [getAnggota]);

    const jadikanLeader = useCallback(async (idPegawai: string) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/set-leader`, {
                'id_group': id,
                'id': idPegawai
            }, { headers: getHeaders() });
            await getAnggota();
            toast.success(response.data?.message || 'Leader berhasil diubah.', {
                position: "top-right", autoClose: 5000, theme: "colored", transition: Bounce,
            });
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.response?.data?.error || 'Gagal mengubah leader.';
            toast.error(errorMsg, {
                position: "top-right", autoClose: 5000, theme: "colored", transition: Bounce,
            });
            console.error(err);
        }
    }, [id, getAnggota]);

    return (
        <div className='overflow-hidden py-3 px-3 md:pr-3 md:pl-0 grid grid-rows-[auto_1fr] gap-3 sm:gap-4'>
            <div className="text-gray-600">
                <h1 className="font-bold text-2xl md:text-3xl mb-2">Group User</h1>
                <Breadcrumb>
                    <Breadcrumb.Item href="/group-user">
                        Group User
                    </Breadcrumb.Item>
                    <Breadcrumb.Item >
                        Tambah Anggota
                    </Breadcrumb.Item>
                </Breadcrumb>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 overflow-auto">
                {/* Panel Pegawai */}
                <div className="bg-white rounded-md border shadow-sm overflow-auto w-full h-full min-h-[300px]">
                    <div className="w-full p-3 sm:p-4 flex justify-between gap-4 sm:gap-6">
                        <form className="w-full sm:w-[24rem]">
                            <input onChange={handleInputChangePegawai}
                                id="q"
                                placeholder='cari pegawai'
                                type="search"
                                name="search"
                                className="px-3 py-2 outline-none border-gray-200 border rounded-md bg-gray-50 w-full text-sm sm:text-base"
                            />
                        </form>
                    </div>

                    {pegawais.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table striped className="text-sm sm:text-base">
                                <Table.Head className="sticky top-0 z-10 bg-white h-12 sm:h-20 border-b">
                                    <Table.HeadCell className="text-center sticky w-10 sm:w-20">NO</Table.HeadCell>
                                    <Table.HeadCell className="text-center hidden sm:table-cell">NIK</Table.HeadCell>
                                    <Table.HeadCell className="text-center">Nama</Table.HeadCell>
                                    <Table.HeadCell className="text-center w-[6rem] sm:w-[12rem]">Kontrol</Table.HeadCell>
                                </Table.Head>

                                <Table.Body className="divide-y">
                                    {pegawais.map((item, index) =>
                                    (<Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800" key={item.id}>
                                        <Table.Cell className="font-bold text-center text-xs sm:text-sm">
                                            {((pagination?.current_page ?? 1) - 1) * (pagination?.per_page ?? 50) + index + 1}
                                        </Table.Cell>
                                        <Table.Cell className="hidden sm:table-cell text-xs sm:text-sm">{item.nik}</Table.Cell>
                                        <Table.Cell>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{item.nama}</span>
                                                {/* Show NIK on mobile inline */}
                                                <span className="sm:hidden text-[11px] text-gray-400">{item.nik}</span>
                                                {item.nama_group && (
                                                    <span className="text-[10px] sm:text-xs text-gray-500 font-medium italic mt-0.5">
                                                        Grup: {item.nama_group} {item.is_leader ? '(Leader)' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="w-full flex items-center justify-center">
                                                {item.nama_group ? (
                                                    <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-100 border border-gray-200 px-1.5 sm:px-2 py-1 rounded cursor-not-allowed whitespace-nowrap">
                                                        Terdaftar
                                                    </span>
                                                ) : (
                                                    <button onClick={() => addNewAnggota(item.nik)} className="font-medium text-cyan-600 hover:underline dark:text-cyan-500 active:scale-95 text-xs sm:text-sm">
                                                        Masukan
                                                    </button>
                                                )}
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>)
                                    )}

                                </Table.Body>
                            </Table>
                        </div>
                    ) : (<DataFetchingNotFound />)}

                    {/* Pagination Controls */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-t">
                            <div className="text-xs sm:text-sm text-gray-600">
                                Hal {pagination.current_page}/{pagination.last_page} <span className="hidden sm:inline">({pagination.total} pegawai)</span>
                            </div>
                            <div className="flex gap-1 sm:gap-2">
                                <button
                                    onClick={() => setPagePegawai(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() => setPagePegawai(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Panel Anggota */}
                <div className="bg-white rounded-md border shadow-sm overflow-auto w-full h-full min-h-[300px]">
                    <div className="w-full p-3 sm:p-4 flex justify-between gap-4 sm:gap-6">
                        <form className="w-full sm:w-[24rem]">
                            <input
                                id="q"
                                placeholder='cari anggota'
                                type="search"
                                onChange={handleInputChangeAnggota}
                                className="px-3 py-2 outline-none border-gray-200 border rounded-md bg-gray-50 w-full text-sm sm:text-base"
                            />
                        </form>
                    </div>

                    {anggota.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table striped className="text-sm sm:text-base">
                                <Table.Head className="sticky top-0 z-10 bg-white h-12 sm:h-20 border-b">
                                    <Table.HeadCell className="text-center sticky w-10 sm:w-20">NO</Table.HeadCell>
                                    <Table.HeadCell className="text-center hidden sm:table-cell">NIK</Table.HeadCell>
                                    <Table.HeadCell className="text-center">Nama</Table.HeadCell>
                                    <Table.HeadCell className="text-center hidden sm:table-cell">Lead</Table.HeadCell>
                                    <Table.HeadCell className="text-center">Kontrol</Table.HeadCell>
                                </Table.Head>

                                <Table.Body className="divide-y">
                                    {anggota.map((item, index) =>
                                    (<Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800" key={item.id}>
                                        <Table.Cell className="font-bold text-center text-xs sm:text-sm">{index + 1}</Table.Cell>
                                        <Table.Cell className="hidden sm:table-cell text-xs sm:text-sm">{item.nik}</Table.Cell>
                                        <Table.Cell>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{item.nama}</span>
                                                {/* Show NIK and leader status on mobile inline */}
                                                <span className="sm:hidden text-[11px] text-gray-400">
                                                    {item.nik} {item.is_leader ? '· Leader' : ''}
                                                </span>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell className="hidden sm:table-cell">{item.is_leader}</Table.Cell>
                                        <Table.Cell>
                                            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4">
                                                <button onClick={() => hapusAnggota(item.id)} className="font-medium text-red-600 hover:underline active:scale-95 text-xs sm:text-sm whitespace-nowrap">
                                                    Hapus
                                                </button>

                                                <button onClick={() => jadikanLeader(item.id)} className="font-medium text-cyan-600 hover:underline active:scale-95 text-xs sm:text-sm whitespace-nowrap">
                                                    <span className="hidden sm:inline">Jadikan Leader</span>
                                                    <span className="sm:hidden">Leader</span>
                                                </button>
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>)
                                    )}

                                </Table.Body>
                            </Table>
                        </div>
                    ) : (<DataFetchingNotFound />)}
                </div>
            </div>
        </div>
    )
}

export default TambahAnggota