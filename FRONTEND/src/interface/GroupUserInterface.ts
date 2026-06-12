export interface DataGroupUser {
    id: string
    nama_group: string
    user_to_group_users_count:string
}

export interface DataGroupUserState {
    groupUsers: DataGroupUser[];
    isLoading: boolean;
    error: string | null;
    fetchDataGroupUser: (queryParams?: string) => Promise<void>;
}