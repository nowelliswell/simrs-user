import { create } from 'zustand'
import { DataPegawaiState } from '../interface/PegawaiInterface';
import PegawaiService from "../utils/PegawaiService";

const PegawaiStore = create<DataPegawaiState>()((set) => ({
    pegawais: [],
    pagination: null,
    isLoading: false,
    error: null,
    fetchDataPegawai: async (queryParams?: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await PegawaiService.getAll(queryParams);
            set({ 
                pegawais: response.data || [], 
                pagination: response.pagination || null,
                isLoading: false 
            });
        } catch (error: any) {
            set({ 
                pegawais: [],
                pagination: null,
                error: error.message || 'Something went wrong', 
                isLoading: false 
            });
        }
    }
}))

export default PegawaiStore;
