import { create } from 'zustand';
import api from '../services/api';

// Get user from localStorage if it exists
let storedUser = null;
try {
    const raw = localStorage.getItem('user');
    storedUser = raw ? JSON.parse(raw) : null;
} catch {
    localStorage.removeItem('user');
    storedUser = null;
}

const useAuthStore = create((set) => ({
    user: storedUser || null,
    isLoading: false,
    error: null,

    // Actions
    register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/users/register', userData);
            localStorage.setItem('user', JSON.stringify(response.data));
            set({ user: response.data, isLoading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message || 'Registration failed',
                isLoading: false
            });
            throw error;
        }
    },

    login: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/users/login', userData);
            localStorage.setItem('user', JSON.stringify(response.data));
            set({ user: response.data, isLoading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message || 'Login failed',
                isLoading: false
            });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('user');
        set({ user: null });
    },

    clearError: () => set({ error: null })
}));

export default useAuthStore;
