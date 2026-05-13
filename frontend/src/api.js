import axios from 'axios';
import { setupMockBackend } from './mockBackend';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // This URL will be intercepted by the mock backend
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Apply mock backend interceptor to handle requests using local storage
setupMockBackend(api);

export default api;
