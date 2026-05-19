import axios from 'axios';

// In production (GitHub Pages), VITE_API_URL is injected at build time by GitHub Actions.
// In local dev, it falls back to localhost:8000.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = window.__TEMP_TOKEN__;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
