import axios from 'axios';

// This is a temporary, hardcoded token for development.
// In a real application, this should be retrieved from a secure client-side store
// (e.g., localStorage or a cookie) after the user logs in.
const DEV_ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImExYjJjM2Q0LWU1ZjYtNzg5MC0xMjM0LTU2Nzg5MGFiY2RlZiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MDU4MTQ1OSwiZXhwIjoxNzUzMTczNDU5fQ.UHkxXsuZ01xW0X65XAt73DXBzYGLAEfKVFk8YlcMyM8';

const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Use an interceptor to dynamically add the Authorization header to every request.
api.interceptors.request.use(
    (config) => {
        // In a real app, you would get the token from storage like this:
        // const token = localStorage.getItem('admin_token');

        // For now, we use the hardcoded development token.
        const token = DEV_ADMIN_TOKEN;

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