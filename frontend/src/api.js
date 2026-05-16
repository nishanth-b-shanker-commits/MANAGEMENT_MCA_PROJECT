import axios from 'axios';
// import { setupMockBackend } from './mockBackend'; // Disabled for live deployment

const api = axios.create({
    baseURL: 'https://portsystemmca.loca.lt', 
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// setupMockBackend(api); // Mock backend disabled so app can talk to the real server

export default api;
