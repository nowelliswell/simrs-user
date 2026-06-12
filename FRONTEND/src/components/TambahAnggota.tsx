import { Breadcrumb, Table } from "flowbite-react"
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import PegawaiStore from "../store/PegawaiStore";
import DataFetchingNotFound from "./DataFetchingNotFound";
import axios from "axios";

function TambahAnggota() {
    const { pegawais, fetchDataPegawai } = PegawaiStore();
    const [searchPegawai, setSearchPegawai] = useState('');
    const [searchAnggota, setSearchAnggota] = useState('');
    const [anggota, setAnggota] = useState([]);
    const { id } = useParams();
    const [debouncedSearchPegawai, setDebouncedSearchPegawai] = useState('');
    const [debouncedSearchAnggota, setDebouncedSearchAnggota] = useState('');

    const handleInputChangePegawai = (event) => {
        setSearchPegawai(event.target.value);
    };

    const handleInputChangeAnggota = (event) => {
        setSearchAnggota(event.target.value);
    };

    const getAnggota = async () => {
        await axios.get(`${import.meta.env.VITE_API_URL}/api/anggota-group-user?idGroup=${id}&search=${debouncedSearchAnggota}`).then((response) => {
            setAnggota(response.data.data);
        }).catch((err) => {
            console.log(err);
        })
    }

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
        fetchDataPegawai(`?search=${debouncedSearchPegawai}`);
    }, [debouncedSearchPegawai]);

    const addNewAnggota = async (nik: string) => {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/anggota-group-user`, { 'nik_pegawai': nik, 'id_group': id }).then(() => {
            getAnggota()
            console.log('berhasil');
        }).catch((err) => {
            console.log(err);
        })
    }

    const hapusAnggota = async (id: string) => {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/anggota-group-user/${id}`).then(() => {
            getAnggota();
            console.log('berhasil');
        }).catch((err) => {
            console.log(err);
        })
    }

    const jadikanLeader = async (idPegawai: string) => {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/set-leader`, {
            'id_group': id,
            'id': idPegawai
        }).then(() => {
            getAnggota();
            console.log('berhasil');
        }).catch((err) => {
            console.log(err);
        })
    }

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
                                    <Table.Cell className="font-bold text-center">{index + 1}</Table.Cell>
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