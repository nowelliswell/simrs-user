import { useParams } from "react-router-dom";
import DetailUserStore from "../store/DetailUserStore";
import { useEffect, useState, FormEvent } from "react";
import { Table } from "flowbite-react";
import UserService from "../utils/UserService";
import DataFetchingNotFound from "./DataFetchingNotFound";
import { Bounce, toast } from "react-toastify";

function DetailUserComponent() {
    const { user, isLoading, error, fetchDataDetailUser, editUsernamePassword } = DetailUserStore();
    const { id } = useParams();
    const [search, setSearch] = useState('');
    const [usernameInput, setUsernameInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [loadingSave, setLoadingSave] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (id) {
                await fetchDataDetailUser(id);
            }
        };
        fetchData();
    }, [id]);

    // Sync input fields saat data user berhasil di-fetch
    useEffect(() => {
        if (user) {
            setUsernameInput(user.id_user ?? '');
            setPasswordInput(user.password ?? '');
        }
    }, [user]);

    const handleClickGanti = async (namaKolom: string, valueKolom: string) => {
        if (id && user) {
            try {
                // ✅ OPTIMISTIC UPDATE: Update UI dulu (instant!)
                const newValue = valueKolom === 'true' ? 'false' : 'true';
                
                // Update store state langsung (instant feedback)
                DetailUserStore.getState().updateUser(namaKolom, newValue);
                
                // Background: Kirim ke backend (user tidak perlu tunggu)
                await UserService.gantiAksesUser(id, namaKolom, valueKolom);
                
            } catch (error) {
                console.log(error);
                // Jika error, rollback dengan refetch data asli
                await fetchDataDetailUser(id);
            }
        }
    };

    const handleSimpanCredential = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!id) return;
        setLoadingSave(true);
        try {
            await editUsernamePassword(id, usernameInput, passwordInput);
            toast.success('Username dan password berhasil diperbarui', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: false,
                theme: "colored",
                transition: Bounce,
            });
            // Refetch agar data terbaru tampil
            await fetchDataDetailUser(id);
        } catch (err) {
            toast.error('Gagal memperbarui username / password', {
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
            setLoadingSave(false);
        }
    };


    if (user) {
        return (
            <div className='overflow-hidden py-3 pr-3 grid grid-rows-[auto_1fr] gap-4'>
                {/* Card atas: form edit username & password */}
                <div className="bg-white rounded-md border shadow-sm p-5 w-full">
                    <h2 className="font-bold text-xl text-gray-700 mb-1">{user.nama}</h2>
                    <p className="text-sm text-gray-400 mb-4">NIK: {id}</p>
                    <form onSubmit={handleSimpanCredential} className="flex flex-wrap items-end gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-600">Username</label>
                            <input
                                type="text"
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                required
                                className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 outline-none focus:border-cyan-400 w-60"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-600">Password</label>
                            <input
                                type="text"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                required
                                className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 outline-none focus:border-cyan-400 w-60"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loadingSave}
                            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingSave ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </form>
                </div>

                {/* Card bawah: tabel akses */}
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
                                    .filter(([key]) => !['nama', 'id_user', 'id_user_plain', 'password'].includes(key))
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