import axios from "axios";

const prefix = 'group-user'

async function getAll(queryParams?: string) {
    try {
        const baseUrl = `${import.meta.env.VITE_API_URL}/api/${prefix}`;
        const url = queryParams ? `${baseUrl}${queryParams}` : baseUrl;
        const response = await axios.get(url);
        return response.data.data; // Akses langsung response.data
    } catch (error) {
        throw error;
    }
}

async function addNew(data: string) {
    try {
        const url = `${import.meta.env.VITE_API_URL}/api/${prefix}`;
        const response = await axios.post(url, { nama_group: data });
        return response.data; // Akses langsung response.data
    } catch (error) {
        throw error;
    }
}

async function edit(data: string, id: string) {
    try {
        const url = `${import.meta.env.VITE_API_URL}/api/${prefix}/${id}`;
        const response = await axios.put(url, { nama_group: data });
        return response.data; // Akses langsung response.data
    } catch (error) {
        throw error;
    }
}

async function deleteData(id: string) {
    try {
        const url = `${import.meta.env.VITE_API_URL}/api/${prefix}/${id}`;
        const response = await axios.delete(url);
        return response.data; // Akses langsung response.data
    } catch (error) {
        throw error;
    }
}

export default {
    getAll,
    addNew,
    edit,
    deleteData
}