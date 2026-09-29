import { create } from 'zustand';
import { api } from '@/lib/api';
import { mutate } from 'swr';

interface UserProfile {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl: string;
    reliabilityScore: number;
    unreadNotificationCount?: number;
    pendingFriendRequestCount?: number;
}

interface AuthState {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    checkAuth: () => Promise<void>;
    login: (token: string, user: UserProfile) => void;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, 

    login: (token, user) => {
        localStorage.setItem('token', token);
        document.cookie = `token=${token}; path=/; max-age=604800;`; // 1 week
        mutate('/User/context', user, { revalidate: false });
        set({ user, isAuthenticated: true, isLoading: false });
    },

    logout: async () => {
        try {
            await api.post('/Auth/logout');
        } catch (error) {
            console.error('Logout failed on backend', error);
        }
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        mutate(() => true, undefined, { revalidate: false });
        set({ user: null, isAuthenticated: false, isLoading: false });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ isLoading: false });
            return;
        }

        try {
            
            const response = await api.get('/User/context');
            mutate('/User/context', response.data, { revalidate: false });
            set({ user: response.data, isAuthenticated: true, isLoading: false });
        } catch (error) {
            console.error('Session expired');
            localStorage.removeItem('token');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    }
}));