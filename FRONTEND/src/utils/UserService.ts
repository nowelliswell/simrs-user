import axios from "axios";

// Tambahkan header X-Database-Mode ke setiap request
const getHeaders = () => {
    const mode = localStorage.getItem('db_mode') || 'development';
    return {
        'X-Database-Mode': mode
    };
};

async function getDetail(id: string) {
    try {
        const baseUrl = `${import.meta.env.VITE_API_URL}/api/detail-user/${id}`;
        const response = await axios.get(baseUrl, { headers: getHeaders() });
        return response.data.data;
    } catch (error) {
        throw error;
    }
}

async function gantiAksesUser(id: string, namaKolom: string, valueKolom: string) {
    try {
        const baseUrl = `${import.meta.env.VITE_API_URL}/api/ganti-akses-user/${id}`;
        const response = await axios.post(baseUrl, { namaKolom: namaKolom, valueKolom: valueKolom }, { headers: getHeaders() });
        return response.data.data;
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
        }, { headers: getHeaders() });
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
        }, { headers: getHeaders() });
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function deleteUser(nik: string) {
    try {
        const baseUrl = `${import.meta.env.VITE_API_URL}/api/delete-user/${nik}`;
        const response = await axios.delete(baseUrl, { headers: getHeaders() });
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
    deleteUser,
}