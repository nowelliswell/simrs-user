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
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState<string>("");
    const [loadingEdit, setLoadingEdit] = useState<boolean>(false);
    const [loadingSesuaikanId, setLoadingSesuaikanId] = useState<string | null>(null);

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

    const handleSaveEdit = async (id: string) => {
        if (!editName.trim()) {
            toast.error("Nama group tidak boleh kosong");
            return;
        }
        setLoadingEdit(true);
        try {
            await GroupUserService.edit(editName, id);
            toast.success("Nama group berhasil diubah", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                theme: "colored",
                transition: Bounce,
            });
            setEditingId(null);
            const queryString = searchParams.toString();
            fetchDataGroupUser(queryString ? `?${queryString}` : '');
        } catch (error: any) {
            const msg = error?.response?.data?.message ?? "Gagal mengubah nama group";
            toast.error(msg, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                theme: "colored",
                transition: Bounce,
            });
        } finally {
            setLoadingEdit(false);
        }
    };

    const handleSesuaikanUser = async (id: string) => {
        const mode = localStorage.getItem('db_mode') || 'development';
        const headers = { 'X-Database-Mode': mode };
        
        setLoadingSesuaikanId(id);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/copy-user-group/${id}`, { headers });
            toast.success('Sesuaikan akses berhasil', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                theme: "colored",
                transition: Bounce,
            });
            console.log(response.data);
        } catch (err: any) {
            const msg = err?.response?.data?.message
                ?? err?.response?.data?.error
                ?? 'Terjadi kesalahan';
            toast.error(`Gagal: ${msg}`, {
                position: "top-right",
                autoClose: 8000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                theme: "colored",
                transition: Bounce,
            });
            console.error('Sesuaikan akses error:', err?.response?.data);
        } finally {
            setLoadingSesuaikanId(null);
        }
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
                    <SearchBoxComponent placeHolder="Cari Nama Group User" />
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
                                <Table.Cell>
                                    {editingId === item.id ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            disabled={loadingEdit}
                                            className="px-3 py-1 border border-gray-200 rounded-md bg-gray-50 outline-none focus:border-cyan-400 w-full font-normal"
                                        />
                                    ) : (
                                        item.nama_group
                                    )}
                                </Table.Cell>
                                <Table.Cell>{item.user_to_group_users_count}</Table.Cell>
                                <Table.Cell>
                                    <div className="w-full flex items-center justify-center gap-6">
                                        {editingId === item.id ? (
                                            <>
                                                <button
                                                    onClick={() => handleSaveEdit(item.id)}
                                                    disabled={loadingEdit}
                                                    className="font-medium text-green-600 hover:underline active:scale-95 disabled:opacity-50"
                                                >
                                                    {loadingEdit ? 'Menyimpan...' : 'Save'}
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    disabled={loadingEdit}
                                                    className="font-medium text-gray-500 hover:underline active:scale-95 disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(item.id);
                                                        setEditName(item.nama_group);
                                                    }}
                                                    className="font-medium text-cyan-600 hover:underline dark:text-cyan-500 active:scale-95"
                                                >
                                                    Edit
                                                </button>

                                                <Link to={`/group-user/${item.id}`}>
                                                    <button className="font-medium text-cyan-600 hover:underline dark:text-cyan-500 active:scale-95">
                                                        Tambah Anggota
                                                    </button>
                                                </Link>

                                                <button 
                                                    disabled={loadingSesuaikanId !== null}
                                                    onClick={() => { handleSesuaikanUser(item.id) }} 
                                                    className="font-medium text-cyan-600 hover:underline dark:text-cyan-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                                                >
                                                    {loadingSesuaikanId === item.id ? 'Menyesuaikan...' : 'Sesuaikan Akses'}
                                                </button>

                                                <button onClick={() => { handleDelete(item.id, item.nama_group) }} className="font-medium text-red-600 hover:underline active:scale-95">
                                                    Hapus
                                                </button>
                                            </>
                                        )}
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