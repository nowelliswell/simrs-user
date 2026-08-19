import axios from "axios";

const getHeaders = () => ({
    'X-Database-Mode': localStorage.getItem('db_mode') || 'development'
});

async function sendMessage(message: string) {
    const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ai-assistant/chat`,
        { message },
        { headers: getHeaders(), timeout: 35000 }
    );
    return response.data;
}

export default { sendMessage };
