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

async function editUsernamePassword(nik: string, idUserBaru: string, passwordBaru: string) {
    try {
        const baseUrl = `${import.meta.env.VITE_API_URL}/api/edit-username-password/${nik}`;
        const response = await axios.post(baseUrl, {
            id_user_baru: idUserBaru,
            password_baru: passwordBaru,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function copyAkses(nikSumber: string, nikTujuan: string) {
    try {
        const baseUrl = `${import.meta.env.VITE_API_URL}/api/copy-akses`;
        const response = await axios.post(baseUrl, {
            userParent: nikSumber,
            userChild: nikTujuan,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export default {
    getDetail,
    gantiAksesUser,
    editUsernamePassword,
    copyAkses,
}