import { create } from 'zustand'
import { DataUserState } from '../interface/UserInterface';
import UserService from "../utils/UserService";

const DetailUserStore = create<DataUserState>()((set) => ({
    user: [],
    isLoading: false,
    error: null,
    updateUser: (namaKolom: string, valueKolom: string) =>
        set((state) => ({
            user: {
                ...state.user,
                [namaKolom]: valueKolom,
            },
        })),
    fetchDataDetailUser: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await UserService.getDetail(id);
            set({ user: response, isLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Something went wrong', isLoading: false });
        }
    },
    editUsernamePassword: async (nik: string, idUserBaru: string, passwordBaru: string) => {
        await UserService.editUsernamePassword(nik, idUserBaru, passwordBaru);
    },
}))

export default DetailUserStore;
