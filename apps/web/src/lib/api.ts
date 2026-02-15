import axios from 'axios';

/**
 * API Base URL - Configured from environment variables
 * Default: http://localhost:3000
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Pre-configured Axios instance for NexoPOS API
 * 
 * Features:
 * - Automatic baseURL configuration
 * - Request/Response interceptors for auth and error handling
 * - JSON content-type headers
 */
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
});

/**
 * Request Interceptor
 * Add authentication tokens or other headers here
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor
 * Handle common error scenarios
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    console.error('Unauthorized - Redirecting to login');
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    break;
                case 403:
                    console.error('Forbidden - Insufficient permissions');
                    break;
                case 404:
                    console.error('Resource not found');
                    break;
                case 500:
                    console.error('Server error:', data);
                    break;
                default:
                    console.error('API Error:', data);
            }
        } else if (error.request) {
            // Request made but no response received
            console.error('Network Error - No response from server');
        } else {
            // Something else happened
            console.error('Error:', error.message);
        }

        return Promise.reject(error);
    }
);

/**
 * Export the base URL for reference
 */
export const baseURL = API_BASE_URL;

/**
 * Export default instance
 */
export default api;
