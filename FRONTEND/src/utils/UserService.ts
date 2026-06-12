import axios from "axios";

async function getDetail(id: string) {
    try {
        const baseUrl = `${import.meta.env.VITE_API_URL}/api/detail-user/${id}`;
        const response = await axios.get(baseUrl);
        return response.data.data; // Akses langsung response.data
    } catch (error) {
        throw error;
    }
}

async function gantiAksesUser(id: string, namaKolom: string, valueKolom: string) {
    try {
        const baseUrl = `${import.meta.env.VITE_API_URL}/api/ganti-akses-user/${id}`;
        const response = await axios.post(baseUrl, { namaKolom: namaKolom, valueKolom: valueKolom });
        return response.data.data; // Akses langsung response.data
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export default {
    getDetail,
    gantiAksesUser,
}