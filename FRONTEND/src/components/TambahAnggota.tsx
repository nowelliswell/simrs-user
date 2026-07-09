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
        <div className='overflow-hidden py-3 pr-3 grid grid-rows-[5rem_1fr] gap-4'>
            <div className="text-gray-600">
                <h1 className="font-bold text-3xl mb-2">Group User</h1>
                <Breadcrumb>
                    <Breadcrumb.Item href="/group-user">
                        Group User
                    </Breadcrumb.Item>
                    <Breadcrumb.Item >
                        Tambah Anggota
                    </Breadcrumb.Item>
                </Breadcrumb>
            </div>

            <div className="grid grid-cols-2 gap-4 overflow-auto">
                <div className="bg-white rounded-md border shadow-sm overflow-auto w-full h-full">
                    <div className="w-full p-4 flex justify-between gap-6">
                        <form className="w-[24rem]">
                            <input onChange={handleInputChangePegawai}
                                id="q"
                                placeholder='cari pegawai'
                                type="search"
                                name="search"
                                className="px-2 py-2 outline-none border-gray-200 border rounded-md bg-gray-50 w-full"
                            />
                        </form>
                    </div>

                    {pegawais.length > 0 ? (
                        <Table striped className="text-base">
                            <Table.Head className="sticky top-0 z-10 bg-white h-20 border-b">
                                <Table.HeadCell className="text-center sticky w-20">NO</Table.HeadCell>
                                <Table.HeadCell className="text-center">NIK</Table.HeadCell>
                                <Table.HeadCell className="text-center">Nama</Table.HeadCell>
                                <Table.HeadCell className="text-center sticky w-[12rem]">Kontrol</Table.HeadCell>
                            </Table.Head>

                            <Table.Body className="divide-y">
                                {pegawais.map((item, index) =>
                                (<Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800" key={item.id}>
                                    <Table.Cell className="font-bold text-center">
                                        {((pagination?.current_page ?? 1) - 1) * (pagination?.per_page ?? 50) + index + 1}
                                    </Table.Cell>
                                    <Table.Cell>{item.nik}</Table.Cell>
                                    <Table.Cell>{item.nama}</Table.Cell>
                                    <Table.Cell>
                                        <div className="w-full flex items-center justify-center gap-6">
                                            <button onClick={() => addNewAnggota(item.nik)} className="font-medium text-cyan-600 hover:underline dark:text-cyan-500 active:scale-95">
                                                Masukan
                                            </button>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>)
                                )}

                            </Table.Body>
                        </Table>
                    ) : (<DataFetchingNotFound />)}

                    {/* Pagination Controls */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <div className="text-sm text-gray-600">
                                Halaman {pagination.current_page} dari {pagination.last_page} ({pagination.total} pegawai)
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPagePegawai(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() => setPagePegawai(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-md border shadow-sm overflow-auto w-full h-full">
                    <div className="w-full p-4 flex justify-between gap-6">
                        <form className="w-[24rem]">
                            <input
                                id="q"
                                placeholder='cari anggota'
                                type="search"
                                onChange={handleInputChangeAnggota}
                                className="px-2 py-2 outline-none border-gray-200 border rounded-md bg-gray-50 w-full"
                            />
                        </form>
                    </div>

                    {anggota.length > 0 ? (
                        <Table striped className="text-base">
                            <Table.Head className="sticky top-0 z-10 bg-white h-20 border-b">
                                <Table.HeadCell className="text-center sticky w-20">NO</Table.HeadCell>
                                <Table.HeadCell className="text-center">NIK</Table.HeadCell>
                                <Table.HeadCell className="text-center">Nama</Table.HeadCell>
                                <Table.HeadCell className="text-center">Lead</Table.HeadCell>
                                <Table.HeadCell className="text-center sticky w-[12rem]">Kontrol</Table.HeadCell>
                            </Table.Head>

                            <Table.Body className="divide-y">
                                {anggota.map((item, index) =>
                                (<Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800" key={item.id}>
                                    <Table.Cell className="font-bold text-center">{index + 1}</Table.Cell>
                                    <Table.Cell>{item.nik}</Table.Cell>
                                    <Table.Cell>{item.nama}</Table.Cell>
                                    <Table.Cell>{item.is_leader}</Table.Cell>
                                    <Table.Cell>
                                        <div className="w-full flex items-center justify-center gap-6">
                                            <button onClick={() => hapusAnggota(item.id)} className="font-medium text-red-600 hover:underline dark:text-cyan-500 active:scale-95">
                                                Hapus Anggota
                                            </button>

                                            <button onClick={() => jadikanLeader(item.id)} className="font-medium text-red-600 hover:underline dark:text-cyan-500 active:scale-95">
                                                Jadikan Leader
                                            </button>
                                        </div>
                                    </Table.Cell>
                                </Table.Row>)
                                )}

                            </Table.Body>
                        </Table>
                    ) : (<DataFetchingNotFound />)}
                </div>
            </div>
        </div>
    )
}

export default TambahAnggota