import axios from "axios";

const prefix = 'group-user'

// Tambahkan header X-Database-Mode ke setiap request
const getHeaders = () => {
    const mode = localStorage.getItem('db_mode') || 'development';
    return {
        'X-Database-Mode': mode
    };
};

async function getAll(queryParams?: string) {
    try {
        const baseUrl = `${import.meta.env.VITE_API_URL}/api/${prefix}`;
        const url = queryParams ? `${baseUrl}${queryParams}` : baseUrl;
        const response = await axios.get(url, { headers: getHeaders() });
        return response.data.data;
    } catch (error) {
        throw error;
    }
}

async function addNew(data: string) {
    try {
        const url = `${import.meta.env.VITE_API_URL}/api/${prefix}`;
        const response = await axios.post(url, { nama_group: data }, { headers: getHeaders() });
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function edit(data: string, id: string) {
    try {
        const url = `${import.meta.env.VITE_API_URL}/api/${prefix}/${id}`;
        const response = await axios.put(url, { nama_group: data }, { headers: getHeaders() });
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function deleteData(id: string) {
    try {
        const url = `${import.meta.env.VITE_API_URL}/api/${prefix}/${id}`;
        const response = await axios.delete(url, { headers: getHeaders() });
        return response.data;
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