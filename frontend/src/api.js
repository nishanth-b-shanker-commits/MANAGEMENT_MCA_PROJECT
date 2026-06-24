import axios from 'axios';
import { setupMockBackend } from './mockBackend';

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

// Auto-enable mockBackend on GitHub Pages, localhost dev, or if explicitly set via environment
const hostname = window.location.hostname;
if (
    import.meta.env.VITE_USE_MOCK === 'true' ||
    hostname.includes('github.io') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
) {
    setupMockBackend(api);
}

export default api;
