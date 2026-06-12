
export interface DataUserState {
    user: any;
    isLoading: boolean;
    error: string | null;
    updateUser: (namaKolom: string, valueKolom: string) => void;
    fetchDataDetailUser: (id: string) => Promise<void>;
    editUsernamePassword: (nik: string, idUserBaru: string, passwordBaru: string) => Promise<void>;
}
