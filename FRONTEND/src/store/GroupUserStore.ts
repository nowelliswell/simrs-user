import { create } from 'zustand'
import { DataGroupUserState } from '../interface/GroupUserInterface';
import GroupUserService from "../utils/GroupUserService";

const GroupUserStore = create<DataGroupUserState>()((set) => ({
    groupUsers: [],
    isLoading: false,
    error: null,
    fetchDataGroupUser: async (queryParams?: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await GroupUserService.getAll(queryParams);
            set({ groupUsers: response, isLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Something went wrong', isLoading: false });
        }
    }
}))

export default GroupUserStore;
