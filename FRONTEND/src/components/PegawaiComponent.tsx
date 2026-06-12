import { useEffect, useState } from 'react';
import PegawaiStore from '../store/PegawaiStore';
import { Link, useSearchParams } from 'react-router-dom';
import { Breadcrumb, Table } from 'flowbite-react';
import DataFetchingNotFound from './DataFetchingNotFound';
import SearchBoxComponent from './SearchBoxComponent';

function PegawaiComponent() {
    const { pegawais, isLoading, error, fetchDataPegawai } = PegawaiStore();
    const [searchParams] = useSearchParams();
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        const queryString = searchParams.toString();
        fetchDataPegawai(queryString ? `?${queryString}` : '');
    }, [searchParams]);

    return (
        <div className='overflow-hidden py-3 pr-3 grid grid-rows-[5rem_1fr] gap-4'>
            <div className="text-gray-600">
                <h1 className="font-bold text-3xl mb-2">Data User Pegawai</h1>
                <Breadcrumb>
                    <Breadcrumb.Item href="/">
                        Pegawai
                    </Breadcrumb.Item>
                </Breadcrumb>
            </div>

            {!isLoading && !error && <div className="bg-white rounded-md border shadow-sm overflow-auto w-full h-full">
                <div className="w-full p-4 flex justify-between gap-6">
                    <SearchBoxComponent placeHolder="Cari nama atau nik pegawai" />
                </div>

                {pegawais.length > 0 ? (
                    <Table striped className="text-base">
                        <Table.Head className="sticky top-0 z-10 bg-white h-20 border-b">
                            <Table.HeadCell className="text-center sticky w-20">NO</Table.HeadCell>
                            <Table.HeadCell className="text-center">NIK</Table.HeadCell>
                            <Table.HeadCell className="text-center">Nama</Table.HeadCell>
                            <Table.HeadCell className="text-center">Jabatan</Table.HeadCell>
                            <Table.HeadCell className="text-center sticky w-[12rem]">Kontrol</Table.HeadCell>
                        </Table.Head>

                        <Table.Body className="divide-y">
                            {pegawais.map((item, index) =>
                            (<Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800" key={item.id}>
                                <Table.Cell className="font-bold text-center">{index + 1}</Table.Cell>
                                <Table.Cell>{item.nik}</Table.Cell>
                                <Table.Cell>{item.nama}</Table.Cell>
                                <Table.Cell>{item.jbtn}</Table.Cell>
                                <Table.Cell>
                                    <div className="w-full flex items-center justify-center gap-6">
                                        <Link to={`/detail-user/${item.nik}`}>
                                            <button className="font-medium text-cyan-600 hover:underline dark:text-cyan-500 active:scale-95">
                                                Edit
                                            </button>
                                        </Link>
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

export default PegawaiComponent