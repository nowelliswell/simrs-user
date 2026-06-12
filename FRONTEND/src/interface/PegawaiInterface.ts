export interface DataPegawai {
    id: string
    nik: string
    nama: string
    jbtn: string
}

export interface DataPegawaiState {
    pegawais: DataPegawai[];
    isLoading: boolean;
    error: string | null;
    fetchDataPegawai: (queryParams?: string) => Promise<void>;
}