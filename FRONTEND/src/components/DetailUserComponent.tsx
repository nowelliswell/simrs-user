import { useParams } from "react-router-dom";
import DetailUserStore from "../store/DetailUserStore";
import { useEffect, useState } from "react";
import { Table } from "flowbite-react";
import UserService from "../utils/UserService";
import DataFetchingNotFound from "./DataFetchingNotFound";

function DetailUserComponent() {
    const { user, isLoading, error, fetchDataDetailUser } = DetailUserStore();
    const { id } = useParams();
    const [search, setSearch] = useState(''); // State untuk pencarian

    useEffect(() => {
        const fetchData = async () => {
            if (id) {
                await fetchDataDetailUser(id); // Tunggu hingga fetch selesai
            }
        };

        fetchData();
    }, [id]);

    const handleClickGanti = async (namaKolom: string, valueKolom: string) => {
        if (id) {
            try {
                await UserService.gantiAksesUser(id, namaKolom, valueKolom);
                fetchDataDetailUser(id);
            } catch (error) {
                console.log(error)
            }
        }
    }


    if (user) {
        return (
            <div className='overflow-hidden py-3 pr-3 grid grid-rows-[5rem_1fr] gap-4'>
                <div className="bg-white rounded-md border shadow-sm overflow-auto w-full h-full">
                    <p>{user.nama}</p>
                    <p>{user.id_user}/{user.password}</p>
                </div>
                <div className="bg-white rounded-md border shadow-sm overflow-auto w-full h-full">
                    <div className="w-full p-4 flex justify-between gap-6">
                        <form id="search-form" role="search" className="w-[24rem]">
                            <input
                                id="q"
                                placeholder='cari akses'
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="px-2 py-2 outline-none border-gray-200 border rounded-md bg-gray-50 w-full"
                            />
                        </form>
                    </div>

                    {Object.keys(user).length > 0 ? (
                        <Table striped className="text-base">
                            <Table.Head className="sticky top-0 z-10 bg-white h-20 border-b">
                                <Table.HeadCell className="text-center">Nama Akses</Table.HeadCell>
                                <Table.HeadCell className="text-center">Akses</Table.HeadCell>
                                <Table.HeadCell className="text-center sticky w-[12rem]">Kontrol</Table.HeadCell>
                            </Table.Head>

                            <Table.Body className="divide-y">
                                {Object.entries(user)
                                    .filter(([key]) => !['nama', 'id_user', 'password'].includes(key))
                                    .filter(([key]) => key.toLowerCase().includes(search.toLowerCase())).map(([key, value]) => (
                                        <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800" key={key}>
                                            <Table.Cell>{key}</Table.Cell>
                                            <Table.Cell className={`${String(value) !== 'true' ? 'text-red-400' : 'text-green-400'}`}>{String(value)}</Table.Cell>
                                            <Table.Cell>
                                                <button onClick={() => { handleClickGanti(key, `${String(value)}`) }} className="font-medium text-cyan-600 hover:underline dark:text-cyan-500 active:scale-95">
                                                    Ganti
                                                </button>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                            </Table.Body>
                        </Table>
                    ) : (
                        <DataFetchingNotFound />
                    )}
                </div>
            </div>
        )
    } else {
        return <div></div>
    }
}

export default DetailUserComponent