import axios from "axios";
import { DashboardData } from "../interface/DashboardInterface";

const getHeaders = () => {
    const mode = localStorage.getItem('db_mode') || 'development';
    return {
        'X-Database-Mode': mode
    };
};

async function getStats(): Promise<DashboardData> {
    try {
        const url = `${import.meta.env.VITE_API_URL}/api/dashboard/stats`;
        const response = await axios.get(url, { headers: getHeaders() });
        return response.data.data;
    } catch (error) {
        throw error;
    }
}

export default {
    getStats,
};
