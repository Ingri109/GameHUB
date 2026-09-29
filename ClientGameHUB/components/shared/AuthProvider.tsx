'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!isLoading && mounted) {
            // Guard: If not authenticated and not on public pages -> redirect to login
            const isPublicRoute = 
                pathname.startsWith('/login') || 
                pathname.startsWith('/auth/callback') ||
                // The new public tier list viewing route:
                /^\/profile\/[^\/]+\/games$/.test(pathname);

            if (!isAuthenticated && !isPublicRoute) {
                router.push('/login');
            }

            // Guard: If authenticated and trying to access login -> redirect to profile
            if (isAuthenticated && pathname === '/login') {
                router.push('/profile');
            }
        }
    }, [isAuthenticated, isLoading, mounted, pathname, router]);

    return <>{children}</>;
}
