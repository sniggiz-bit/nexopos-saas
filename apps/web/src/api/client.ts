import axios from 'axios';

// In development, we use the '/api' prefix to let Vite proxy handle the requests
// In production (Docker), VITE_API_URL should be set to '/api' or the full URL
const API_BASE_URL = '/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    // NOTE: Do NOT set Content-Type here globally.
    // Axios sets it automatically per-request:
    //  - JSON body → 'application/json'
    //  - FormData  → 'multipart/form-data; boundary=...' (boundary is required by Multer)
    headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
    },
});

export const api = apiClient;

// Request interceptor for adding auth tokens if needed
apiClient.interceptors.request.use(
    (config) => {
        // Add auth token here if needed
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error status
            console.error('API Error:', error.response.data);
        } else if (error.request) {
            // Request made but no response
            console.error('Network Error:', error.message);
        } else {
            // Something else happened
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);
