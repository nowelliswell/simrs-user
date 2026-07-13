export interface DataPegawai {
    id: string
    nik: string
    nama: string
    jbtn: string
    has_user: number // 1 = punya akses, 0 = belum punya akses
    nama_group?: string
    is_leader?: number | boolean
}

export interface PaginationInfo {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
}

export interface DataPegawaiState {
    pegawais: DataPegawai[];
    pagination: PaginationInfo | null;
    isLoading: boolean;
    error: string | null;
    fetchDataPegawai: (queryParams?: string) => Promise<void>;
}