import axios from 'axios';
import { setupMockBackend } from './mockBackend';

const api = axios.create({
    // Connect to deployed backend URL if provided, otherwise default to local development server
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', 
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Enabled mock backend since user demands purely static GitHub Pages hosting without a real backend
setupMockBackend(api);

export default api;
