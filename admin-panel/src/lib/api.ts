import axios from 'axios';

// Remove the hardcoded DEV_ADMIN_TOKEN
// In a real application, this should be retrieved from a secure client-side store
// (e.g., localStorage or a cookie) after the user logs in.

const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Use an interceptor to dynamically add the Authorization header to every request.
api.interceptors.request.use(
    (config) => {
        // Get the token from localStorage
        let token = null;
        if (typeof window !== 'undefined') {
            token = localStorage.getItem('admin_token');
        }
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api; 