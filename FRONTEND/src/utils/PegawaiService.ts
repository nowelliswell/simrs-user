import axios from "axios";

const prefix = 'pegawai'

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

// async function addNew(data: string) {
//     try {
//         const url = `${import.meta.env.VITE_API_URL}/api/${prefix}`;
//         const response = await axios.post(url, { golongan: data });
//         return response.data; // Akses langsung response.data
//     } catch (error) {
//         throw error;
//     }
// }

export default {
    getAll,
}