import { create } from 'zustand';
import api from '../services/api';

// Get user from localStorage if it exists
const user = JSON.parse(localStorage.getItem('user'));

const useAuthStore = create((set) => ({
    user: user || null,
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
                error: error.response?.data?.message || 'Registration failed',
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
                error: error.response?.data?.message || 'Login failed',
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
