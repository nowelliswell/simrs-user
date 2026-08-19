export interface DashboardKPI {
    total_pegawai: number;
    user_aktif: number;
    user_belum_akses: number;
    persentase_akses: number;
    total_group: number;
    pegawai_dalam_group: number;
    pegawai_luar_group: number;
}

export interface GroupDistributionItem {
    id: string;
    nama_group: string;
    total_anggota: number;
    has_leader: boolean;
}

export interface TopJabatanItem {
    jabatan: string;
    total: number;
}

export interface AccountStatusItem {
    label: string;
    value: number;
    color: string;
}

export interface GroupTanpaLeaderItem {
    id: string;
    nama_group: string;
    total_anggota: number;
}

export interface PegawaiTanpaGroupItem {
    nik: string;
    nama: string;
    jbtn: string;
    has_user: number;
}

export interface LeaderAktifItem {
    group_id: string;
    nama_group: string;
    nik_leader: string;
    nama_leader: string;
    jabatan_leader: string;
}

export interface DashboardData {
    kpi: DashboardKPI;
    charts: {
        distribusi_group: GroupDistributionItem[];
        top_jabatan: TopJabatanItem[];
        status_akun: AccountStatusItem[];
    };
    security_audit: {
        group_tanpa_leader: GroupTanpaLeaderItem[];
        pegawai_terbaru_tanpa_group: PegawaiTanpaGroupItem[];
        daftar_leader_aktif: LeaderAktifItem[];
    };
}
