import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api', // URL твого C# бекенду
});

// Автоматично додаємо токен до кожного запиту
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Reusable fetcher for SWR
export const fetcher = (url: string) => api.get(url).then(res => res.data);