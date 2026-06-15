export interface DataPegawai {
    id: string
    nik: string
    nama: string
    jbtn: string
    has_user: number // 1 = punya akses, 0 = belum punya akses
}

export interface DataPegawaiState {
    pegawais: DataPegawai[];
    isLoading: boolean;
    error: string | null;
    fetchDataPegawai: (queryParams?: string) => Promise<void>;
}