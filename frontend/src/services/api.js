import axios from 'axios';

// Create an Axios instance
const api = axios.create({
    baseURL: '/api', // Proxy will handle redirecting this to port 5000 in dev
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
    (config) => {
        // We will store the user (which contains token) in localStorage
        const user = JSON.parse(localStorage.getItem('user'));

        if (user && user.token) {
            config.headers['Authorization'] = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
