import { Breadcrumb, Table } from "flowbite-react"
import { Link, useSearchParams } from "react-router-dom";
import GroupUserStore from "../store/GroupUserStore";
import { useEffect, useState, FormEvent } from "react";
import DataFetchingNotFound from "./DataFetchingNotFound";
import SearchBoxComponent from "./SearchBoxComponent";
import { Bounce, toast } from "react-toastify";
import axios from "axios";
import GroupUserService from "../utils/GroupUserService";

function GroupUserComponent() {
    const [loadingAdd, setLoadingAdd] = useState<boolean>(false);
    const [errorAdd, setErrorAdd] = useState<string | null>(null);
    const { groupUsers, isLoading, error, fetchDataGroupUser, deleteGroupUser } = GroupUserStore();
    const [searchParams] = useSearchParams();
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        const queryString = searchParams.toString();
        fetchDataGroupUser(queryString ? `?${queryString}` : '');
    }, [searchParams]);

    const handleSubmitCreateSatuan = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoadingAdd(true);
        setErrorAdd(null);

        const form = e.target as HTMLFormElement;  // Type assertion
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            await GroupUserService.addNew(data.nama_group as string);
            const queryString = searchParams.toString();
            fetchDataGroupUser(queryString ? `?${queryString}` : '');
            form.reset();
            toast.success('Tambah data berhasil', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                progress: undefined,
                theme: "light",
                transition: Bounce,
            });

        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {  // Cek apakah error dari axios
                if (error.response && error.response.status === 422) {
                    setErrorAdd(error.response.data.message);  // Ambil pesan error dari response
                } else {
                    setErrorAdd("Terjadi kesalahan pada server.");
                }
            } else if (error instanceof Error) {
                setErrorAdd(error.message);  // Error biasa (bukan dari axios)
            } else {
                setErrorAdd("An unknown error occurred.");  // Error tidak diketahui
            }
        } finally {
            setLoadingAdd(false);
        }
    }

    const handleDelete = async (id: string, namaGroup: string) => {
        if (!window.confirm(`Hapus group "${namaGroup}"? Semua anggota dalam group ini juga akan terhapus.`)) return;
        try {
            await deleteGroupUser(id);
            toast.success('Group berhasil dihapus', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                theme: "colored",
                transition: Bounce,
            });
        } catch (err) {
            toast.error('Gagal menghapus group', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                theme: "colored",
                transition: Bounce,
            });
        }
    }

    const handleSesuaikanUser = async (id: string) => {
        await axios.get(`${import.meta.env.VITE_API_URL}/api/copy-user-group/${id}`).then((response) => {
            toast.success('Success', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                progress: undefined,
                theme: "colored",
                transition: Bounce,
            });

            console.log(response.data.data);
        }).catch((err) => {
            toast.error('Gagal', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                progress: undefined,
                theme: "colored",
                transition: Bounce,
            });

            console.log(err);
        })
    }

    return (
        <div className='overflow-hidden py-3 pr-3 grid grid-rows-[5rem_10rem_1fr] gap-4'>
            <div className="text-gray-600">
                <h1 className="font-bold text-3xl mb-2">Group User</h1>
                <Breadcrumb>
                    <Breadcrumb.Item href="/">
                        Group User
                    </Breadcrumb.Item>
                </Breadcrumb>
            </div>

            <div className="bg-white rounded-md border shadow-sm w-full h-full flex items-center px-6">
                <form className="flex items-center gap-4" onSubmit={handleSubmitCreateSatuan}>
                    <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Nama Group</label>
                    <input
                        id="email1"
                        name="nama_group"
                        type="text"
                        required
                        className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 outline-none focus:border-cyan-400 w-72"
                    />
                    <button
                        type="submit"
                        disabled={loadingAdd}
                        className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white font-medium rounded-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loadingAdd ? 'Menyimpan...' : 'Tambah Group User Baru'}
                    </button>
                    {errorAdd && <p className="text-red-500 text-sm">{errorAdd}</p>}
                </form>
            </div>

            {!isLoading && !error && <div className="bg-white rounded-md border shadow-sm overflow-auto w-full h-full">
                <div className="w-full p-4 flex justify-between gap-6">
                    <SearchBoxComponent placeHolder="Cari nama atau nik pegawai" />
                </div>

                {groupUsers.length > 0 ? (
                    <Table striped className="text-base">
                        <Table.Head className="sticky top-0 z-10 bg-white h-20 border-b">
                            <Table.HeadCell className="text-center sticky w-20">NO</Table.HeadCell>
                            <Table.HeadCell className="text-center">Nama Group</Table.HeadCell>
                            <Table.HeadCell className="text-center">Jumlah Anggota</Table.HeadCell>
                            <Table.HeadCell className="text-center sticky w-[12rem]">Kontrol</Table.HeadCell>
                        </Table.Head>

                        <Table.Body className="divide-y">
                            {groupUsers.map((item, index) =>
                            (<Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800" key={item.id}>
                                <Table.Cell className="font-bold text-center">{index + 1}</Table.Cell>
                                <Table.Cell>{item.nama_group}</Table.Cell>
                                <Table.Cell>{item.user_to_group_users_count}</Table.Cell>
                                <Table.Cell>
                                    <div className="w-full flex items-center justify-center gap-6">
                                        <Link to={`/detail-user/${item.id}`}>
                                            <button className="font-medium text-cyan-600 hover:underline dark:text-cyan-500 active:scale-95">
                                                Edit
                                            </button>
                                        </Link>

                                        <Link to={`/group-user/${item.id}`}>
                                            <button className="font-medium text-cyan-600 hover:underline dark:text-cyan-500 active:scale-95">
                                                Tambah Anggota
                                            </button>
                                        </Link>

                                        <button onClick={() => { handleSesuaikanUser(item.id) }} className="font-medium text-cyan-600 hover:underline dark:text-cyan-500 active:scale-95">
                                            Sesuaikan Akses
                                        </button>

                                        <button onClick={() => { handleDelete(item.id, item.nama_group) }} className="font-medium text-red-600 hover:underline active:scale-95">
                                            Hapus
                                        </button>
                                    </div>
                                </Table.Cell>
                            </Table.Row>)
                            )}

                        </Table.Body>
                    </Table>
                ) : (<DataFetchingNotFound />)}
            </div>}
        </div>
    )
}

export default GroupUserComponent